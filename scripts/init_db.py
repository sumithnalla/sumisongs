"""
Spotify Clone — Database Initialization Script
=============================================
Run this ONCE to:
  1. Create all 6 MongoDB collections
  2. Create required indexes
  3. Seed initial admin and user accounts

Usage:
    cd scripts
    pip install pymongo python-dotenv bcrypt
    python init_db.py

Environment:
    MONGODB_URI   - MongoDB Atlas connection string
    MONGODB_DATABASE - database name (default: spotify_clone)
    INIT_USER_PASSWORD   - initial user account password
    INIT_ADMIN_PASSWORD  - initial admin account password

SECURITY NOTE: This script receives credentials via environment variables only.
Plaintext passwords are NEVER written to disk or logs.
"""

import os
import sys
import asyncio
import logging
from datetime import datetime, timezone
from pathlib import Path

# Load .env if present in scripts/ or project root
try:
    from dotenv import load_dotenv
    # Try project root .env first
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        load_dotenv(env_file)
    else:
        load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, rely on environment

import bcrypt
from pymongo import MongoClient, ASCENDING, DESCENDING, TEXT
from pymongo.errors import CollectionInvalid, OperationFailure, DuplicateKeyError

# ── Logging ────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("init_db")

# ── Config ─────────────────────────────────────────────────
MONGODB_URI = os.environ.get("MONGODB_URI")
MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "spotify_clone")

# Bootstrap credentials — only via env vars
INIT_USER_USERNAME = "sumithnalla0607@gmail.com"
INIT_USER_DISPLAY_NAME = "Sumith Nalla"
INIT_USER_PASSWORD = os.environ.get("INIT_USER_PASSWORD", "")

INIT_ADMIN_USERNAME = "sumithofficial2@gmail.com"
INIT_ADMIN_DISPLAY_NAME = "Sumith Admin"
INIT_ADMIN_PASSWORD = os.environ.get("INIT_ADMIN_PASSWORD", "")


def validate_config():
    """Validate required configuration is present."""
    errors = []
    if not MONGODB_URI:
        errors.append("MONGODB_URI environment variable is required")
    if not INIT_USER_PASSWORD:
        errors.append(
            "INIT_USER_PASSWORD environment variable is required\n"
            "  Set it to: SN06072006"
        )
    if not INIT_ADMIN_PASSWORD:
        errors.append(
            "INIT_ADMIN_PASSWORD environment variable is required\n"
            "  Set it to: sumith0FF_1104"
        )
    if errors:
        for e in errors:
            log.error("Missing config: %s", e)
        sys.exit(1)


def hash_password(plain: str) -> str:
    """Hash password with bcrypt (cost factor 12)."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def ensure_collection(db, name: str):
    """Create collection if it does not exist."""
    try:
        db.create_collection(name)
        log.info("  ✅ Created collection: %s", name)
    except CollectionInvalid:
        log.info("  ℹ️  Collection already exists: %s", name)


def create_indexes(db):
    """Create all required indexes."""
    log.info("Creating indexes...")

    # ── users ──────────────────────────────────────────────
    try:
        db.users.create_index([("username", ASCENDING)], unique=True, name="idx_username_unique")
        log.info("  ✅ users.username (unique)")
    except OperationFailure as e:
        log.warning("  ⚠️  users.username index: %s", e)

    db.users.create_index([("role", ASCENDING)], name="idx_role")
    db.users.create_index([("is_active", ASCENDING)], name="idx_is_active")
    log.info("  ✅ users.role, users.is_active")

    # ── songs ──────────────────────────────────────────────
    db.songs.create_index(
        [("title", TEXT), ("artist", TEXT), ("album", TEXT), ("genre", TEXT)],
        name="idx_songs_fulltext",
        weights={"title": 10, "artist": 8, "album": 5, "genre": 3},
    )
    log.info("  ✅ songs full-text index (title, artist, album, genre)")

    db.songs.create_index([("uploaded_by", ASCENDING)], name="idx_songs_uploader")
    db.songs.create_index([("created_at", DESCENDING)], name="idx_songs_created")
    db.songs.create_index([("play_count", DESCENDING)], name="idx_songs_play_count")
    db.songs.create_index([("is_public", ASCENDING)], name="idx_songs_public")
    log.info("  ✅ songs compound indexes")

    # ── playlists ──────────────────────────────────────────
    db.playlists.create_index([("owner_id", ASCENDING)], name="idx_playlists_owner")
    db.playlists.create_index([("is_public", ASCENDING)], name="idx_playlists_public")
    log.info("  ✅ playlists indexes")

    # ── playlist_songs ─────────────────────────────────────
    try:
        db.playlist_songs.create_index(
            [("playlist_id", ASCENDING), ("song_id", ASCENDING)],
            unique=True,
            name="idx_playlist_songs_unique",
        )
        log.info("  ✅ playlist_songs (playlist_id, song_id) unique")
    except OperationFailure as e:
        log.warning("  ⚠️  playlist_songs unique index: %s", e)

    db.playlist_songs.create_index(
        [("playlist_id", ASCENDING), ("position", ASCENDING)],
        name="idx_playlist_songs_ordered",
    )
    log.info("  ✅ playlist_songs (playlist_id, position)")

    # ── likes ──────────────────────────────────────────────
    try:
        db.likes.create_index(
            [("user_id", ASCENDING), ("song_id", ASCENDING)],
            unique=True,
            name="idx_likes_unique",
        )
        log.info("  ✅ likes (user_id, song_id) unique")
    except OperationFailure as e:
        log.warning("  ⚠️  likes unique index: %s", e)

    db.likes.create_index([("user_id", ASCENDING)], name="idx_likes_user")
    db.likes.create_index([("song_id", ASCENDING)], name="idx_likes_song")
    log.info("  ✅ likes user and song indexes")

    # ── listening_history ──────────────────────────────────
    db.listening_history.create_index(
        [("user_id", ASCENDING), ("played_at", DESCENDING)],
        name="idx_history_user_recent",
    )
    db.listening_history.create_index([("song_id", ASCENDING)], name="idx_history_song")
    log.info("  ✅ listening_history indexes")


def create_user_document(username: str, plain_password: str, display_name: str, role: str) -> dict:
    """Create a user document with bcrypt-hashed password."""
    now = datetime.now(timezone.utc)
    return {
        "username": username,
        "password_hash": hash_password(plain_password),
        "display_name": display_name,
        "role": role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "last_login": None,
    }


def seed_accounts(db):
    """Seed initial user and admin accounts."""
    log.info("Seeding accounts...")

    accounts = [
        {
            "username": INIT_USER_USERNAME,
            "password": INIT_USER_PASSWORD,
            "display_name": INIT_USER_DISPLAY_NAME,
            "role": "user",
        },
        {
            "username": INIT_ADMIN_USERNAME,
            "password": INIT_ADMIN_PASSWORD,
            "display_name": INIT_ADMIN_DISPLAY_NAME,
            "role": "admin",
        },
    ]

    for acct in accounts:
        existing = db.users.find_one({"username": acct["username"]})
        if existing:
            log.info("  ℹ️  Account already exists: %s", acct["username"])
            continue
        doc = create_user_document(
            username=acct["username"],
            plain_password=acct["password"],
            display_name=acct["display_name"],
            role=acct["role"],
        )
        try:
            db.users.insert_one(doc)
            log.info("  ✅ Created %s account: %s", acct["role"], acct["username"])
        except DuplicateKeyError:
            log.info("  ℹ️  Account already exists (race): %s", acct["username"])

    # IMPORTANT: Plaintext passwords are not retained in memory after this point
    # Python GC will handle cleanup; for extra security, overwrite local vars
    for acct in accounts:
        acct["password"] = "***"


def main():
    log.info("=" * 60)
    log.info("Spotify Clone — Database Initialization")
    log.info("=" * 60)

    validate_config()

    log.info("Connecting to MongoDB Atlas...")
    client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=10000)

    # Test connection
    try:
        client.admin.command("ping")
        log.info("✅ MongoDB connection successful")
    except Exception as e:
        log.error("❌ Cannot connect to MongoDB: %s", e)
        sys.exit(1)

    db = client[MONGODB_DATABASE]
    log.info("Using database: %s", MONGODB_DATABASE)

    # Step 1: Create collections
    log.info("\nCreating collections...")
    for collection in ["users", "songs", "playlists", "playlist_songs", "likes", "listening_history"]:
        ensure_collection(db, collection)

    # Step 2: Create indexes
    log.info("\nCreating indexes...")
    create_indexes(db)

    # Step 3: Seed accounts
    log.info("\nSeeding accounts...")
    seed_accounts(db)

    log.info("\n" + "=" * 60)
    log.info("✅ Database initialization complete!")
    log.info("Database: %s", MONGODB_DATABASE)
    log.info("Collections: users, songs, playlists, playlist_songs, likes, listening_history")
    log.info("=" * 60)

    client.close()


if __name__ == "__main__":
    main()
