"""Local filesystem storage provider — DEV FALLBACK.

Preserves the existing local file upload/stream/delete behavior from songs.py.
Used when STORAGE_PROVIDER=local or as a fallback during development.

storage_ref format: "local-audio:<absolute_path>" or "local-cover:<absolute_path>"
"""
import logging
from pathlib import Path
from typing import AsyncGenerator, Optional, Tuple

from fastapi import HTTPException

from app.services.storage.base import BaseStorageProvider

log = logging.getLogger(__name__)

_PREFIX_AUDIO = "local-audio:"
_PREFIX_COVER = "local-cover:"
_CHUNK_SIZE = 65536  # 64 KB


class LocalProvider(BaseStorageProvider):
    """Storage provider that reads/writes files on the local filesystem."""

    # ------------------------------------------------------------------ #
    # Upload                                                               #
    # ------------------------------------------------------------------ #

    async def upload_audio(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "audio/mpeg",
    ) -> str:
        upload_dir = Path("uploads/songs")
        upload_dir.mkdir(parents=True, exist_ok=True)
        filename = Path(key).name
        dest = upload_dir / filename
        dest.write_bytes(file_bytes)
        ref = f"{_PREFIX_AUDIO}{dest.resolve()}"
        log.info("Local audio saved: %s (%d bytes)", dest, len(file_bytes))
        return ref

    async def upload_cover(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "image/jpeg",
    ) -> str:
        cover_dir = Path("uploads/covers")
        cover_dir.mkdir(parents=True, exist_ok=True)
        filename = Path(key).name
        dest = cover_dir / filename
        dest.write_bytes(file_bytes)
        ref = f"{_PREFIX_COVER}{dest.resolve()}"
        log.info("Local cover saved: %s (%d bytes)", dest, len(file_bytes))
        return ref

    # ------------------------------------------------------------------ #
    # Stream                                                               #
    # ------------------------------------------------------------------ #

    async def stream_audio(
        self,
        storage_ref: str,
        range_header: Optional[str] = None,
    ) -> Tuple[AsyncGenerator[bytes, None], int, int, int, str]:
        file_path = self._resolve_audio_path(storage_ref)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Local audio not found: {file_path}")

        total_size = file_path.stat().st_size
        start = 0
        end = total_size - 1

        if range_header and range_header.startswith("bytes="):
            try:
                s, e = range_header[6:].split("-")
                start = int(s) if s else 0
                end = int(e) if e else total_size - 1
            except (ValueError, IndexError):
                pass

        start = max(0, min(start, total_size - 1))
        end = max(start, min(end, total_size - 1))

        async def _generator() -> AsyncGenerator[bytes, None]:
            with open(file_path, "rb") as f:
                f.seek(start)
                remaining = end - start + 1
                while remaining > 0:
                    chunk = f.read(min(_CHUNK_SIZE, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

        return _generator(), start, end, total_size, "audio/mpeg"

    # ------------------------------------------------------------------ #
    # Cover                                                                #
    # ------------------------------------------------------------------ #

    async def get_cover_bytes(self, storage_ref: str) -> Tuple[bytes, str]:
        file_path = self._resolve_cover_path(storage_ref)
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Local cover not found: {file_path}")
        data = file_path.read_bytes()
        # Detect content type from extension
        ext = file_path.suffix.lower()
        ct_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp"}
        return data, ct_map.get(ext, "image/jpeg")

    # ------------------------------------------------------------------ #
    # Delete                                                               #
    # ------------------------------------------------------------------ #

    async def delete_audio(self, storage_ref: str) -> bool:
        if not storage_ref:
            return True
        try:
            path = self._resolve_audio_path(storage_ref)
            if path.exists():
                path.unlink()
                log.info("Local audio deleted: %s", path)
            return True
        except Exception as exc:
            log.error("Local audio delete failed: %s", exc)
            return False

    async def delete_cover(self, storage_ref: str) -> bool:
        if not storage_ref:
            return True
        try:
            path = self._resolve_cover_path(storage_ref)
            if path.exists():
                path.unlink()
                log.info("Local cover deleted: %s", path)
            return True
        except Exception as exc:
            log.error("Local cover delete failed: %s", exc)
            return False

    # ------------------------------------------------------------------ #
    # Exists                                                               #
    # ------------------------------------------------------------------ #

    async def exists(self, storage_ref: str) -> bool:
        try:
            if storage_ref.startswith(_PREFIX_AUDIO):
                return self._resolve_audio_path(storage_ref).exists()
            if storage_ref.startswith(_PREFIX_COVER):
                return self._resolve_cover_path(storage_ref).exists()
            # Legacy bare path
            return Path(storage_ref).exists()
        except Exception:
            return False

    # ------------------------------------------------------------------ #
    # Helpers                                                              #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _resolve_audio_path(storage_ref: str) -> Path:
        if storage_ref.startswith(_PREFIX_AUDIO):
            return Path(storage_ref[len(_PREFIX_AUDIO):])
        # Legacy: bare absolute path (backward compat with old local_path field)
        return Path(storage_ref)

    @staticmethod
    def _resolve_cover_path(storage_ref: str) -> Path:
        if storage_ref.startswith(_PREFIX_COVER):
            return Path(storage_ref[len(_PREFIX_COVER):])
        return Path(storage_ref)
