"""MongoDB async database connection via Motor + GridFS bucket accessors."""
import logging
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorDatabase,
    AsyncIOMotorGridFSBucket,
)
from app.config import get_settings

log = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None
_audio_bucket: AsyncIOMotorGridFSBucket | None = None
_cover_bucket: AsyncIOMotorGridFSBucket | None = None


async def connect_to_mongo() -> None:
    """Initialize MongoDB connection and GridFS buckets."""
    global _client, _db, _audio_bucket, _cover_bucket
    settings = get_settings()
    log.info("Connecting to MongoDB Atlas...")
    _client = AsyncIOMotorClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=10000,
        connectTimeoutMS=10000,
        socketTimeoutMS=30000,
    )
    _db = _client[settings.mongodb_database]
    # Verify connection
    await _client.admin.command("ping")
    log.info("[OK] MongoDB connected -- database: %s", settings.mongodb_database)

    # Initialize GridFS buckets (uses existing connection — no second client)
    _audio_bucket = AsyncIOMotorGridFSBucket(_db, bucket_name="audio_files")
    _cover_bucket = AsyncIOMotorGridFSBucket(_db, bucket_name="cover_images")
    log.info("[OK] GridFS buckets initialized (audio_files, cover_images)")


async def close_mongo_connection() -> None:
    """Close MongoDB connection."""
    global _client, _db, _audio_bucket, _cover_bucket
    if _client:
        _client.close()
        log.info("MongoDB connection closed")
    _client = None
    _db = None
    _audio_bucket = None
    _cover_bucket = None


def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance. Raises if not connected."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return _db


def get_audio_bucket() -> AsyncIOMotorGridFSBucket:
    """Get the GridFS audio bucket. Raises if not connected."""
    if _audio_bucket is None:
        raise RuntimeError("GridFS not initialized. Call connect_to_mongo() first.")
    return _audio_bucket


def get_cover_bucket() -> AsyncIOMotorGridFSBucket:
    """Get the GridFS cover image bucket. Raises if not connected."""
    if _cover_bucket is None:
        raise RuntimeError("GridFS not initialized. Call connect_to_mongo() first.")
    return _cover_bucket
