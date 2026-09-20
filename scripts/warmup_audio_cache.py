"""Pre-warm local audio cache for instant playback of all songs."""
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

import asyncio
from app.database import connect_to_mongo, get_database, get_audio_bucket
from app.services.storage.gridfs_provider import CACHE_DIR, _PREFIX_AUDIO

SONGS_DIR = Path(__file__).resolve().parent.parent / "songs"

async def warmup():
    await connect_to_mongo()
    db = get_database()
    bucket = get_audio_bucket()
    
    songs = await db.songs.find({}).to_list(100)
    print(f"Checking cache for {len(songs)} songs...")
    
    cached_count = 0
    for s in songs:
        storage_ref = s.get("storage_ref")
        if not storage_ref or not storage_ref.startswith(_PREFIX_AUDIO):
            continue
        file_id_str = storage_ref[len(_PREFIX_AUDIO):]
        cache_file = CACHE_DIR / f"{file_id_str}.mp3"
        
        if cache_file.exists() and cache_file.stat().st_size > 0:
            print(f"  [ALREADY CACHED] {s['title']} ({cache_file.stat().st_size:,} bytes)")
            cached_count += 1
            continue
        
        # Check if we have the local file in songs/
        local_path = s.get("local_path")
        written = False
        if local_path and Path(local_path).exists():
            data = Path(local_path).read_bytes()
            cache_file.write_bytes(data)
            print(f"  [COPIED FROM LOCAL] {s['title']} -> {cache_file.name} ({len(data):,} bytes)")
            cached_count += 1
            written = True
        else:
            # Check songs/ directory by filename
            from bson import ObjectId
            for candidate in SONGS_DIR.glob("*.mp3"):
                # If name matches or download from GridFS
                pass
            
            if not written:
                # Download once from GridFS
                try:
                    from bson import ObjectId
                    g = await bucket.open_download_stream(ObjectId(file_id_str))
                    data = await g.read()
                    cache_file.write_bytes(data)
                    print(f"  [FETCHED FROM GRIDFS] {s['title']} -> {cache_file.name} ({len(data):,} bytes)")
                    cached_count += 1
                except Exception as e:
                    print(f"  [FAILED] {s['title']}: {e}")

    print(f"\nWarmup complete! {cached_count}/{len(songs)} songs in local fast cache.")

if __name__ == "__main__":
    asyncio.run(warmup())
