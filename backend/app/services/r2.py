"""Cloudflare R2 service using boto3 S3-compatible API."""
import logging
import uuid
from typing import Optional

import boto3
from botocore.exceptions import ClientError
from botocore.config import Config

from app.config import get_settings

log = logging.getLogger(__name__)

_s3_client = None


def get_r2_client():
    """Get or create the R2/S3 client (lazy singleton)."""
    global _s3_client
    if _s3_client is not None:
        return _s3_client

    settings = get_settings()
    if not settings.r2_access_key_id or not settings.r2_secret_access_key:
        log.warning("R2 credentials not configured — storage operations will fail")
        return None

    _s3_client = boto3.client(
        "s3",
        endpoint_url=settings.r2_endpoint_url,
        aws_access_key_id=settings.r2_access_key_id,
        aws_secret_access_key=settings.r2_secret_access_key,
        region_name="auto",
        config=Config(signature_version="s3v4"),
    )
    return _s3_client


def generate_presigned_url(object_key: str, expires_in: int = 3600) -> Optional[str]:
    """Generate a presigned GET URL for an R2 object."""
    client = get_r2_client()
    if client is None:
        return None

    settings = get_settings()
    try:
        url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": settings.r2_bucket_name, "Key": object_key},
            ExpiresIn=expires_in,
        )
        return url
    except ClientError as e:
        log.error("Failed to generate presigned URL for %s: %s", object_key, e)
        return None


async def upload_file_to_r2(
    file_bytes: bytes,
    object_key: str,
    content_type: str = "application/octet-stream",
) -> bool:
    """Upload bytes to R2. Returns True on success."""
    client = get_r2_client()
    if client is None:
        raise RuntimeError("R2 client not configured")

    settings = get_settings()
    try:
        client.put_object(
            Bucket=settings.r2_bucket_name,
            Key=object_key,
            Body=file_bytes,
            ContentType=content_type,
        )
        log.info("Uploaded to R2: %s (%d bytes)", object_key, len(file_bytes))
        return True
    except ClientError as e:
        log.error("R2 upload failed for %s: %s", object_key, e)
        raise


async def delete_file_from_r2(object_key: str) -> bool:
    """Delete an object from R2. Returns True if deleted (or not found)."""
    client = get_r2_client()
    if client is None:
        raise RuntimeError("R2 client not configured")

    settings = get_settings()
    try:
        client.delete_object(Bucket=settings.r2_bucket_name, Key=object_key)
        log.info("Deleted from R2: %s", object_key)
        return True
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "")
        if error_code == "NoSuchKey":
            log.warning("R2 object not found (already deleted?): %s", object_key)
            return True
        log.error("R2 delete failed for %s: %s", object_key, e)
        raise


def check_r2_health() -> dict:
    """Check R2 connectivity."""
    client = get_r2_client()
    if client is None:
        return {"status": "unconfigured"}

    settings = get_settings()
    try:
        client.head_bucket(Bucket=settings.r2_bucket_name)
        return {"status": "ok"}
    except ClientError as e:
        return {"status": "error", "detail": str(e)}
