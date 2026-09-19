"""Migrate existing local-file songs into MongoDB GridFS.

Run this ONCE after enabling STORAGE_PROVIDER=gridfs.

What it does:
  1. Finds all songs in DB where storage_ref is not yet set
  2. Reads the local MP3 file (from local_path or songs/ directory)
  3. Uploads it to GridFS audio_files bucket
  4. If cover exists locally, uploads to GridFS cover_images bucket
  5. Updates the song document with storage_ref and cover_storage_ref
  6. Does NOT delete local files (they stay for local fallback use)

Safe to re-run — skips songs that already have storage_ref set.
"""
import asyncio
import os
import sys
from pathlib import Path

# Allow running from repo root
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / "backend" / ".env")

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket

MONGODB_URI = os.environ["MONGODB_URI"]
MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "spotify_clone")

# Songs directory (relative to repo root)
REPO_ROOT = Path(__file__).parent.parent
SONGS_DIR = REPO_ROOT / "songs"

_PREFIX_AUDIO = "gridfs-audio:"
_PREFIX_COVER = "gridfs-cover:"


async def migrate():
    print("=" * 60)
    print("GridFS Migration — Existing Local Songs")
    print("=" * 60)

    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=10000)
    db = client[MONGODB_DATABASE]

    # Verify connection
    await client.admin.command("ping")
    print(f"[OK] Connected to MongoDB: {MONGODB_DATABASE}")

    audio_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="audio_files")
    cover_bucket = AsyncIOMotorGridFSBucket(db, bucket_name="cover_images")

    # Find songs without a storage_ref (legacy / local-file songs)
    cursor = db.songs.find({"storage_ref": {"$in": [None, ""]}})
    songs = await cursor.to_list(length=1000)

    print(f"\nFound {len(songs)} songs without storage_ref (need migration)")

    migrated = 0
    skipped = 0
    failed = 0

    for song in songs:
        song_id = str(song["_id"])
        title = song.get("title", "Unknown")
        audio_key = song.get("audio_file_key", "")
        local_path = song.get("local_path")

        print(f"\n  [{migrated + skipped + failed + 1}/{len(songs)}] {title}")

        # Resolve audio file path
        audio_path: Path | None = None

        if local_path and Path(local_path).exists():
            audio_path = Path(local_path)
        else:
            filename = Path(audio_key).name if audio_key else ""
            candidates = [
                SONGS_DIR / filename,
                REPO_ROOT / audio_key,
            ]
            for c in candidates:
                if c.exists():
                    audio_path = c
                    break

        if not audio_path:
            print(f"    [SKIP] Cannot find audio file (local_path={local_path}, key={audio_key})")
            skipped += 1
            continue

        try:
            # Upload audio to GridFS
            audio_bytes = audio_path.read_bytes()
            file_id = await audio_bucket.upload_from_stream(
                audio_key or audio_path.name,
                audio_bytes,
                metadata={"content_type": "audio/mpeg", "key": audio_key, "migrated": True},
            )
            storage_ref = f"{_PREFIX_AUDIO}{file_id}"
            print(f"    Audio  -> GridFS {storage_ref} ({len(audio_bytes):,} bytes)")

            # Upload cover if it exists locally
            cover_storage_ref = None
            local_cover = song.get("local_cover_path")
            if local_cover and Path(local_cover).exists():
                cover_bytes = Path(local_cover).read_bytes()
                ext = Path(local_cover).suffix.lower()
                ct_map = {".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp"}
                content_type = ct_map.get(ext, "image/jpeg")
                cover_key = song.get("cover_image_key") or f"covers/{song_id}{ext}"
                cover_id = await cover_bucket.upload_from_stream(
                    cover_key,
                    cover_bytes,
                    metadata={"content_type": content_type, "key": cover_key, "migrated": True},
                )
                cover_storage_ref = f"{_PREFIX_COVER}{cover_id}"
                print(f"    Cover  -> GridFS {cover_storage_ref} ({len(cover_bytes):,} bytes)")

            # Update MongoDB document
            update = {"storage_ref": storage_ref}
            if cover_storage_ref:
                update["cover_storage_ref"] = cover_storage_ref

            await db.songs.update_one({"_id": song["_id"]}, {"$set": update})
            print(f"    [OK] Updated song document")
            migrated += 1

        except Exception as exc:
            print(f"    [ERROR] {exc}")
            failed += 1

    print("\n" + "=" * 60)
    print(f"Migration complete:")
    print(f"  Migrated : {migrated}")
    print(f"  Skipped  : {skipped}  (file not found locally — upload manually)")
    print(f"  Failed   : {failed}")
    print("=" * 60)

    # Check Atlas storage usage
    stats = await db.command("dbStats")
    storage_mb = stats.get("storageSize", 0) / (1024 * 1024)
    data_mb = stats.get("dataSize", 0) / (1024 * 1024)
    print(f"\nMongoDB storage: {storage_mb:.1f} MB (storageSize), {data_mb:.1f} MB (dataSize)")

    if storage_mb > 400:
        print("WARNING: Approaching Atlas M0 512MB limit! Consider upgrading or switching to R2.")
    elif storage_mb > 300:
        print("NOTICE: Over 300MB used. Monitor storage usage.")
    else:
        print(f"[OK] Storage healthy — {512 - storage_mb:.0f} MB headroom remaining on Atlas M0.")

    client.close()


if __name__ == "__main__":
    asyncio.run(migrate())
