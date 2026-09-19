"""Abstract base class for all storage providers."""
from abc import ABC, abstractmethod
from typing import AsyncGenerator, Optional, Tuple


class BaseStorageProvider(ABC):
    """
    Storage provider interface. All providers (GridFS, R2, Local) implement this.

    storage_ref format (provider-neutral string):
      - GridFS:  "gridfs:<ObjectId_hex>"
      - R2:      "r2:<object_key>"
      - Local:   "local:<absolute_path>"
    """

    @abstractmethod
    async def upload_audio(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "audio/mpeg",
    ) -> str:
        """Upload audio bytes. Returns a storage_ref string."""
        ...

    @abstractmethod
    async def upload_cover(
        self,
        file_bytes: bytes,
        key: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """Upload cover image bytes. Returns a storage_ref string."""
        ...

    @abstractmethod
    async def stream_audio(
        self,
        storage_ref: str,
        range_header: Optional[str] = None,
    ) -> Tuple[AsyncGenerator[bytes, None], int, int, int, str]:
        """
        Stream audio data, honouring HTTP Range requests.

        Returns:
            (async_generator, start, end, total_size, content_type)
        Callers build the appropriate 200/206 response from these values.
        """
        ...

    @abstractmethod
    async def get_cover_bytes(
        self,
        storage_ref: str,
    ) -> Tuple[bytes, str]:
        """
        Retrieve cover image.

        Returns:
            (image_bytes, content_type)
        """
        ...

    @abstractmethod
    async def delete_audio(self, storage_ref: str) -> bool:
        """Delete audio file. Returns True on success or if already absent."""
        ...

    @abstractmethod
    async def delete_cover(self, storage_ref: str) -> bool:
        """Delete cover image. Returns True on success or if already absent."""
        ...

    @abstractmethod
    async def exists(self, storage_ref: str) -> bool:
        """Check whether an object exists in this provider."""
        ...
