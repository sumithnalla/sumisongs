"""Cloudflare R2 storage provider — FUTURE provider.

Wraps the existing services/r2.py into the BaseStorageProvider interface.
services/r2.py is NOT modified — this is purely an adapter.

storage_ref format: "r2-audio:<key>" or "r2-cover:<key>"

To activate: set STORAGE_PROVIDER=r2 in .env
"""
import logging
from typing import AsyncGenerator, Optional, Tuple

from fastapi import HTTPException

from app.services.storage.base import BaseStorageProvider
from app.services import r2 as r2_svc

log = logging.getLogger(__name__)

_PREFIX_AUDIO = "r2-audio:"
_PREFIX_COVER = "r2-cover:"


class R2Provider(BaseStorageProvider):
    """Storage provider backed by Cloudflare R2 (S3-compatible)."""

    # ------------------------------------------------------------------ #
    # Upload                                                               #
    # ------------------------------------------------------------------ #

    async def upload_audio(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "audio/mpeg",
    ) -> str:
        client = r2_svc.get_r2_client()
        if client is None:
            raise RuntimeError(
                "R2 storage provider selected but R2 credentials are not configured. "
                "Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in .env, or switch STORAGE_PROVIDER=local."
            )
        await r2_svc.upload_file_to_r2(file_bytes, key, content_type)
        return f"{_PREFIX_AUDIO}{key}"

    async def upload_cover(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "image/jpeg",
    ) -> str:
        client = r2_svc.get_r2_client()
        if client is None:
            raise RuntimeError(
                "R2 storage provider selected but R2 credentials are not configured."
            )
        await r2_svc.upload_file_to_r2(file_bytes, key, content_type)
        return f"{_PREFIX_COVER}{key}"

    # ------------------------------------------------------------------ #
    # Stream                                                               #
    # ------------------------------------------------------------------ #

    async def stream_audio(
        self,
        storage_ref: str,
        range_header: Optional[str] = None,
    ) -> Tuple[AsyncGenerator[bytes, None], int, int, int, str]:
        """
        R2 uses presigned URLs for streaming — the frontend hits R2 directly.
        This method is a fallback for direct proxy streaming if needed.
        """
        key = self._parse_audio_key(storage_ref)
        # Generate a presigned URL and redirect, or fetch bytes for proxying
        # For now we raise — callers should use get_stream_url() which returns presigned URL
        raise NotImplementedError(
            "R2Provider.stream_audio: use /songs/{id}/stream endpoint to get presigned URL instead."
        )

    def get_presigned_audio_url(self, storage_ref: str, expires_in: int = 3600) -> Optional[str]:
        """Get a presigned R2 URL for direct browser streaming."""
        key = self._parse_audio_key(storage_ref)
        return r2_svc.generate_presigned_url(key, expires_in)

    def get_presigned_cover_url(self, storage_ref: str, expires_in: int = 3600) -> Optional[str]:
        """Get a presigned R2 URL for cover image."""
        key = self._parse_cover_key(storage_ref)
        return r2_svc.generate_presigned_url(key, expires_in)

    # ------------------------------------------------------------------ #
    # Cover                                                                #
    # ------------------------------------------------------------------ #

    async def get_cover_bytes(self, storage_ref: str) -> Tuple[bytes, str]:
        raise NotImplementedError(
            "R2Provider.get_cover_bytes: use presigned URL from get_presigned_cover_url() instead."
        )

    # ------------------------------------------------------------------ #
    # Delete                                                               #
    # ------------------------------------------------------------------ #

    async def delete_audio(self, storage_ref: str) -> bool:
        key = self._parse_audio_key(storage_ref)
        try:
            return await r2_svc.delete_file_from_r2(key)
        except Exception as exc:
            log.error("R2 audio delete failed for %s: %s", storage_ref, exc)
            return False

    async def delete_cover(self, storage_ref: str) -> bool:
        if not storage_ref:
            return True
        key = self._parse_cover_key(storage_ref)
        try:
            return await r2_svc.delete_file_from_r2(key)
        except Exception as exc:
            log.error("R2 cover delete failed for %s: %s", storage_ref, exc)
            return False

    # ------------------------------------------------------------------ #
    # Exists                                                               #
    # ------------------------------------------------------------------ #

    async def exists(self, storage_ref: str) -> bool:
        try:
            if storage_ref.startswith(_PREFIX_AUDIO):
                key = self._parse_audio_key(storage_ref)
            elif storage_ref.startswith(_PREFIX_COVER):
                key = self._parse_cover_key(storage_ref)
            else:
                return False
            health = r2_svc.check_r2_health()
            return health.get("status") == "ok"
        except Exception:
            return False

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_audio_key(storage_ref: str) -> str:
        if storage_ref.startswith(_PREFIX_AUDIO):
            return storage_ref[len(_PREFIX_AUDIO):]
        # Legacy: bare key (backward compat with old audio_file_key field)
        return storage_ref

    @staticmethod
    def _parse_cover_key(storage_ref: str) -> str:
        if storage_ref.startswith(_PREFIX_COVER):
            return storage_ref[len(_PREFIX_COVER):]
        return storage_ref
