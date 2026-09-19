"""Storage abstraction package.

Exports get_storage_provider() which returns the configured provider:
  - "gridfs"  → GridFSProvider  (ACTIVE)
  - "r2"      → R2Provider      (FUTURE)
  - "local"   → LocalProvider   (DEV FALLBACK)
"""
from app.config import get_settings
from app.services.storage.base import BaseStorageProvider


def get_storage_provider() -> BaseStorageProvider:
    """Return the configured storage provider instance."""
    provider_name = get_settings().storage_provider.lower().strip()

    if provider_name == "gridfs":
        from app.services.storage.gridfs_provider import GridFSProvider
        return GridFSProvider()

    if provider_name == "r2":
        from app.services.storage.r2_provider import R2Provider
        return R2Provider()

    if provider_name == "local":
        from app.services.storage.local_provider import LocalProvider
        return LocalProvider()

    raise ValueError(
        f"Unknown STORAGE_PROVIDER='{provider_name}'. "
        "Valid values: 'gridfs', 'r2', 'local'."
    )


__all__ = ["get_storage_provider", "BaseStorageProvider"]
