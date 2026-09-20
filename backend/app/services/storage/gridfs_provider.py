"""MongoDB GridFS storage provider — ACTIVE provider.

Stores audio and cover images in two GridFS buckets:
  - audio_files  (for MP3s)
  - cover_images (for album art)

Includes high-performance local disk caching so audio streams instantly
without repeated internet roundtrips to MongoDB Atlas.

storage_ref format: "gridfs-audio:<ObjectId_hex>"
"""
import logging
from pathlib import Path
from typing import AsyncGenerator, Optional, Tuple

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import HTTPException

from app.database import get_audio_bucket, get_cover_bucket
from app.services.storage.base import BaseStorageProvider

log = logging.getLogger(__name__)

_PREFIX_AUDIO = "gridfs-audio:"
_PREFIX_COVER = "gridfs-cover:"
_CHUNK_SIZE = 131072  # 128 KB chunks for local disk streaming

# Local cache directory for instant audio streaming
CACHE_DIR = Path(__file__).resolve().parent.parent.parent.parent / "backend" / ".cache" / "audio"
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class GridFSProvider(BaseStorageProvider):
    """Active storage provider using MongoDB GridFS with local acceleration cache."""

    # ------------------------------------------------------------------ #
    # Upload                                                               #
    # ------------------------------------------------------------------ #

    async def upload_audio(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "audio/mpeg",
    ) -> str:
        bucket = get_audio_bucket()
        file_id = await bucket.upload_from_stream(
            key,
            file_bytes,
            metadata={"content_type": content_type, "key": key},
        )
        storage_ref = f"{_PREFIX_AUDIO}{file_id}"
        
        # Populate cache immediately so new upload plays with zero latency
        try:
            cache_file = CACHE_DIR / f"{file_id}.mp3"
            cache_file.write_bytes(file_bytes)
        except Exception as e:
            log.warning("Could not write audio to cache: %s", e)

        log.info("GridFS audio uploaded: %s (%d bytes)", storage_ref, len(file_bytes))
        return storage_ref

    async def upload_cover(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "image/jpeg",
    ) -> str:
        bucket = get_cover_bucket()
        file_id = await bucket.upload_from_stream(
            key,
            file_bytes,
            metadata={"content_type": content_type, "key": key},
        )
        storage_ref = f"{_PREFIX_COVER}{file_id}"
        log.info("GridFS cover uploaded: %s (%d bytes)", storage_ref, len(file_bytes))
        return storage_ref

    # ------------------------------------------------------------------ #
    # Stream audio (with HTTP Range request support & local disk cache)     #
    # ------------------------------------------------------------------ #

    async def stream_audio(
        self,
        storage_ref: str,
        range_header: Optional[str] = None,
    ) -> Tuple[AsyncGenerator[bytes, None], int, int, int, str]:
        """
        Stream audio with Range support.
        Uses local disk cache for instant playback and seeks.
        Returns (generator, start, end, total_size, content_type)
        """
        file_id = self._parse_audio_ref(storage_ref)
        cache_file = CACHE_DIR / f"{file_id}.mp3"

        if not cache_file.exists():
            bucket = get_audio_bucket()
            try:
                grid_out = await bucket.open_download_stream(file_id)
            except Exception as exc:
                log.error("GridFS open failed for %s: %s", storage_ref, exc)
                raise HTTPException(status_code=404, detail="Audio file not found in GridFS")

            data = await grid_out.read()
            try:
                cache_file.write_bytes(data)
            except Exception as e:
                log.warning("Could not write audio cache: %s", e)
            total_size = len(data)
        else:
            total_size = cache_file.stat().st_size

        content_type: str = "audio/mpeg"

        # Parse Range header (e.g. "bytes=0-65535")
        start = 0
        end = total_size - 1

        if range_header and range_header.startswith("bytes="):
            try:
                range_spec = range_header[6:]
                s, e = range_spec.split("-")
                start = int(s) if s else 0
                end = int(e) if e else total_size - 1
            except (ValueError, IndexError):
                pass  # malformed Range → serve full file

        # Clamp
        start = max(0, min(start, total_size - 1))
        end = max(start, min(end, total_size - 1))

        async def _generator() -> AsyncGenerator[bytes, None]:
            with open(cache_file, "rb") as f:
                f.seek(start)
                remaining = end - start + 1
                while remaining > 0:
                    read_len = min(_CHUNK_SIZE, remaining)
                    chunk = f.read(read_len)
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return _generator(), start, end, total_size, content_type

    # ------------------------------------------------------------------ #
    # Cover image                                                          #
    # ------------------------------------------------------------------ #

    async def get_cover_bytes(self, storage_ref: str) -> Tuple[bytes, str]:
        file_id = self._parse_cover_ref(storage_ref)
        bucket = get_cover_bucket()

        try:
            grid_out = await bucket.open_download_stream(file_id)
        except Exception as exc:
            log.error("GridFS cover open failed for %s: %s", storage_ref, exc)
            raise HTTPException(status_code=404, detail="Cover image not found in GridFS")

        data = await grid_out.read()
        meta = grid_out.metadata or {}
        content_type = meta.get("content_type", "image/jpeg")
        return data, content_type

    # ------------------------------------------------------------------ #
    # Delete                                                               #
    # ------------------------------------------------------------------ #

    async def delete_audio(self, storage_ref: str) -> bool:
        try:
            file_id = self._parse_audio_ref(storage_ref)
        except HTTPException:
            log.warning("delete_audio: invalid ref ignored: %s", storage_ref)
            return True

        # Remove from local cache
        cache_file = CACHE_DIR / f"{file_id}.mp3"
        if cache_file.exists():
            try:
                cache_file.unlink()
            except Exception:
                pass

        bucket = get_audio_bucket()
        try:
            await bucket.delete(file_id)
            log.info("GridFS audio deleted: %s", storage_ref)
            return True
        except Exception as exc:
            log.error("GridFS audio delete failed for %s: %s", storage_ref, exc)
            return False

    async def delete_cover(self, storage_ref: str) -> bool:
        if not storage_ref:
            return True
        try:
            file_id = self._parse_cover_ref(storage_ref)
        except HTTPException:
            log.warning("delete_cover: invalid ref ignored: %s", storage_ref)
            return True

        bucket = get_cover_bucket()
        try:
            await bucket.delete(file_id)
            log.info("GridFS cover deleted: %s", storage_ref)
            return True
        except Exception as exc:
            log.error("GridFS cover delete failed for %s: %s", storage_ref, exc)
            return False

    # ------------------------------------------------------------------ #
    # Exists                                                               #
    # ------------------------------------------------------------------ #

    async def exists(self, storage_ref: str) -> bool:
        try:
            if storage_ref.startswith(_PREFIX_AUDIO):
                file_id = self._parse_audio_ref(storage_ref)
                cache_file = CACHE_DIR / f"{file_id}.mp3"
                if cache_file.exists():
                    return True
                bucket = get_audio_bucket()
            elif storage_ref.startswith(_PREFIX_COVER):
                file_id = self._parse_cover_ref(storage_ref)
                bucket = get_cover_bucket()
            else:
                return False

            cursor = bucket.find({"_id": file_id})
            docs = await cursor.to_list(length=1)
            return len(docs) > 0
        except Exception:
            return False

    # ------------------------------------------------------------------ #
    # Internal helpers                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_audio_ref(storage_ref: str) -> ObjectId:
        if not storage_ref.startswith(_PREFIX_AUDIO):
            raise HTTPException(status_code=400, detail=f"Invalid GridFS audio ref: {storage_ref}")
        try:
            return ObjectId(storage_ref[len(_PREFIX_AUDIO):])
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Malformed GridFS audio ref: {storage_ref}")

    @staticmethod
    def _parse_cover_ref(storage_ref: str) -> ObjectId:
        if not storage_ref.startswith(_PREFIX_COVER):
            raise HTTPException(status_code=400, detail=f"Invalid GridFS cover ref: {storage_ref}")
        try:
            return ObjectId(storage_ref[len(_PREFIX_COVER):])
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Malformed GridFS cover ref: {storage_ref}")
