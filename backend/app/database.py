"""MongoDB async database connection via Motor."""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.config import get_settings

log = logging.getLogger(__name__)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Initialize MongoDB connection."""
    global _client, _db
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


async def close_mongo_connection() -> None:
    """Close MongoDB connection."""
    global _client, _db
    if _client:
        _client.close()
        log.info("MongoDB connection closed")
    _client = None
    _db = None


def get_database() -> AsyncIOMotorDatabase:
    """Get the database instance. Raises if not connected."""
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_to_mongo() first.")
    return _db
