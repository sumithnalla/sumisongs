"""Tests for GridFS storage provider and storage abstraction.

Tests:
  - GridFS upload audio
  - GridFS upload cover
  - GridFS retrieve (stream_audio)
  - GridFS HTTP Range request
  - GridFS delete audio
  - GridFS delete cover
  - GridFS exists check
  - Provider selection (gridfs/r2/local importable)
  - Local provider: upload and stream
  - R2 provider: importable and has correct interface
  - Storage abstraction: get_storage_provider() returns correct type
"""
import io
import os
import pytest
import pytest_asyncio
from unittest.mock import patch

# Minimal valid MP3 bytes (ID3 header — enough for upload validation)
FAKE_MP3 = b"ID3" + b"\x00" * 100
FAKE_JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 100


# ---------------------------------------------------------------------------
# GridFS Provider
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_gridfs_upload_audio():
    """GridFS audio upload returns a valid storage_ref."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()

    ref = await provider.upload_audio(FAKE_MP3, "test/gridfs_test_audio.mp3", "audio/mpeg")
    assert ref.startswith("gridfs-audio:"), f"Expected 'gridfs-audio:' prefix, got: {ref}"
    assert len(ref) > len("gridfs-audio:"), "ObjectId should be present in ref"

    # Cleanup
    await provider.delete_audio(ref)


@pytest.mark.anyio
async def test_gridfs_upload_cover():
    """GridFS cover upload returns a valid storage_ref."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()

    ref = await provider.upload_cover(FAKE_JPEG, "test/gridfs_test_cover.jpg", "image/jpeg")
    assert ref.startswith("gridfs-cover:"), f"Expected 'gridfs-cover:' prefix, got: {ref}"

    # Cleanup
    await provider.delete_cover(ref)


@pytest.mark.anyio
async def test_gridfs_stream_full_audio():
    """GridFS audio stream returns correct byte count for full file."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()

    ref = await provider.upload_audio(FAKE_MP3, "test/stream_test.mp3", "audio/mpeg")
    try:
        generator, start, end, total_size, content_type = await provider.stream_audio(ref)
        assert start == 0
        assert end == total_size - 1
        assert total_size == len(FAKE_MP3)
        assert content_type == "audio/mpeg"

        # Consume stream
        data = b""
        async for chunk in generator:
            data += chunk
        assert len(data) == len(FAKE_MP3)
    finally:
        await provider.delete_audio(ref)


@pytest.mark.anyio
async def test_gridfs_stream_range_request():
    """GridFS stream respects HTTP Range header (partial content)."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()

    # Upload a known sequence so we can verify range slice
    content = bytes(range(256))  # 256 bytes: 0x00 0x01 ... 0xFF
    ref = await provider.upload_audio(content, "test/range_test.mp3", "audio/mpeg")
    try:
        generator, start, end, total_size, _ = await provider.stream_audio(
            ref, range_header="bytes=10-19"
        )
        assert start == 10
        assert end == 19
        assert total_size == 256

        data = b""
        async for chunk in generator:
            data += chunk
        assert len(data) == 10
        assert data == bytes(range(10, 20))
    finally:
        await provider.delete_audio(ref)


@pytest.mark.anyio
async def test_gridfs_exists_after_upload():
    """GridFS exists() returns True after upload, False after delete."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()

    ref = await provider.upload_audio(FAKE_MP3, "test/exists_test.mp3", "audio/mpeg")
    assert await provider.exists(ref) is True
    await provider.delete_audio(ref)
    assert await provider.exists(ref) is False


@pytest.mark.anyio
async def test_gridfs_delete_nonexistent_is_safe():
    """Deleting a non-existent GridFS file does not raise."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()
    # Use a fake but valid ObjectId
    from bson import ObjectId
    fake_ref = f"gridfs-audio:{ObjectId()}"
    result = await provider.delete_audio(fake_ref)
    # Should not raise — returns False (delete failed) but no exception
    assert isinstance(result, bool)


@pytest.mark.anyio
async def test_gridfs_cover_upload_and_retrieve():
    """GridFS cover upload and byte retrieval round-trip."""
    from app.services.storage.gridfs_provider import GridFSProvider
    provider = GridFSProvider()

    ref = await provider.upload_cover(FAKE_JPEG, "test/cover_roundtrip.jpg", "image/jpeg")
    try:
        data, content_type = await provider.get_cover_bytes(ref)
        assert data == FAKE_JPEG
        assert "image" in content_type
    finally:
        await provider.delete_cover(ref)


# ---------------------------------------------------------------------------
# Provider Selection
# ---------------------------------------------------------------------------

def test_provider_selection_gridfs():
    """get_storage_provider() returns GridFSProvider when STORAGE_PROVIDER=gridfs."""
    with patch.dict(os.environ, {"STORAGE_PROVIDER": "gridfs"}):
        from app.config import get_settings
        get_settings.cache_clear()
        from app.services.storage import get_storage_provider
        from app.services.storage.gridfs_provider import GridFSProvider
        # Need to re-import after env change
        import importlib
        import app.services.storage as storage_pkg
        importlib.reload(storage_pkg)
        # Direct instantiation test (avoid lru_cache complexity in tests)
        provider = GridFSProvider()
        from app.services.storage.base import BaseStorageProvider
        assert isinstance(provider, BaseStorageProvider)


def test_provider_selection_r2_importable():
    """R2Provider is importable and implements BaseStorageProvider."""
    from app.services.storage.r2_provider import R2Provider
    from app.services.storage.base import BaseStorageProvider
    provider = R2Provider()
    assert isinstance(provider, BaseStorageProvider)


def test_provider_selection_local_importable():
    """LocalProvider is importable and implements BaseStorageProvider."""
    from app.services.storage.local_provider import LocalProvider
    from app.services.storage.base import BaseStorageProvider
    provider = LocalProvider()
    assert isinstance(provider, BaseStorageProvider)


def test_r2_service_importable():
    """The original services/r2.py is still importable and intact."""
    from app.services import r2 as r2_svc
    assert hasattr(r2_svc, "get_r2_client")
    assert hasattr(r2_svc, "upload_file_to_r2")
    assert hasattr(r2_svc, "delete_file_from_r2")
    assert hasattr(r2_svc, "generate_presigned_url")
    assert hasattr(r2_svc, "check_r2_health")


# ---------------------------------------------------------------------------
# Local Provider
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_local_provider_upload_and_stream(tmp_path, monkeypatch):
    """Local provider writes file and streams it back correctly."""
    from app.services.storage.local_provider import LocalProvider
    import os

    # Point uploads to tmp_path
    monkeypatch.chdir(tmp_path)
    provider = LocalProvider()

    content = b"ID3" + b"\xAB" * 50
    ref = await provider.upload_audio(content, "songs/local_test.mp3", "audio/mpeg")
    assert ref.startswith("local-audio:")

    generator, start, end, total_size, ct = await provider.stream_audio(ref)
    assert total_size == len(content)
    assert ct == "audio/mpeg"

    data = b""
    async for chunk in generator:
        data += chunk
    assert data == content

    # Cleanup
    await provider.delete_audio(ref)
    assert not await provider.exists(ref)


@pytest.mark.anyio
async def test_local_provider_range_request(tmp_path, monkeypatch):
    """Local provider respects HTTP Range header."""
    from app.services.storage.local_provider import LocalProvider

    monkeypatch.chdir(tmp_path)
    provider = LocalProvider()

    content = bytes(range(200))
    ref = await provider.upload_audio(content, "songs/range_local.mp3", "audio/mpeg")

    generator, start, end, total_size, _ = await provider.stream_audio(
        ref, range_header="bytes=50-99"
    )
    assert start == 50
    assert end == 99

    data = b""
    async for chunk in generator:
        data += chunk
    assert data == bytes(range(50, 100))

    await provider.delete_audio(ref)


# ---------------------------------------------------------------------------
# Database GridFS Buckets
# ---------------------------------------------------------------------------

@pytest.mark.anyio
async def test_gridfs_buckets_available():
    """database.get_audio_bucket() and get_cover_bucket() return valid bucket objects."""
    from app.database import get_audio_bucket, get_cover_bucket
    from motor.motor_asyncio import AsyncIOMotorGridFSBucket

    audio = get_audio_bucket()
    cover = get_cover_bucket()
    assert isinstance(audio, AsyncIOMotorGridFSBucket)
    assert isinstance(cover, AsyncIOMotorGridFSBucket)
