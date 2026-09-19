"""Seed sample songs from songs/ directory into MongoDB."""
import os
import glob
from pathlib import Path
from datetime import datetime, timezone
from bson import ObjectId
from pymongo import MongoClient
from mutagen.mp3 import MP3

MONGODB_URI = os.environ.get(
    "MONGODB_URI",
    "mongodb+srv://spotifyclone:SpotifyApp_Secure2024!@spotifyclone.a9uqpkf.mongodb.net/?retryWrites=true&w=majority"
)
MONGODB_DATABASE = os.environ.get("MONGODB_DATABASE", "spotify_clone")

SAMPLE_SONG_METADATA = [
    {"title": "Midnight City Vibes", "artist": "Luna Eclipse", "album": "Neon Dreams", "genre": "Synthwave"},
    {"title": "Echoes in the Rain", "artist": "The Soundscapes", "album": "Reflections", "genre": "Indie Pop"},
    {"title": "Golden Hour Reverie", "artist": "Aura", "album": "Sunlight", "genre": "Lo-Fi"},
    {"title": "Electric Pulse", "artist": "Cybernetic", "album": "Future Drive", "genre": "Electronic"},
    {"title": "Velvet Horizon", "artist": "Silk & Stone", "album": "Afterglow", "genre": "R&B"},
    {"title": "Astral Journey", "artist": "Cosmic Drift", "album": "Stargazer", "genre": "Ambient"},
    {"title": "Summer Nostalgia", "artist": "Coastal Waves", "album": "High Tides", "genre": "Chillout"},
    {"title": "Shadows Dance", "artist": "Nightfall", "album": "Dark Room", "genre": "Pop"},
    {"title": "Caffeine Rush", "artist": "Metro Beats", "album": "Downtown", "genre": "Hip Hop"},
    {"title": "Serenade of Silence", "artist": "Harmony Bloom", "album": "Serenity", "genre": "Acoustic"},
    {"title": "Infinite Rhythm", "artist": "Pulse Project", "album": "Tempo", "genre": "Dance"},
    {"title": "Dawn Anthem", "artist": "Solaris", "album": "First Light", "genre": "Electronic"},
]

def seed_songs():
    client = MongoClient(MONGODB_URI)
    db = client[MONGODB_DATABASE]
    
    # Get user to attribute uploads to
    user = db.users.find_one({"role": "admin"})
    user_id = user["_id"] if user else ObjectId()

    # Find songs in songs/ directory
    root_dir = Path(__file__).parent.parent
    song_files = sorted(glob.glob(str(root_dir / "songs" / "*.mp3")))
    
    print(f"Found {len(song_files)} mp3 files in songs/")

    for i, file_path in enumerate(song_files):
        p = Path(file_path)
        filename = p.name
        
        # Check if already seeded
        existing = db.songs.find_one({"audio_file_key": f"songs/{filename}"})
        if existing:
            print(f"Already seeded: {filename}")
            continue

        meta = SAMPLE_SONG_METADATA[i % len(SAMPLE_SONG_METADATA)]
        try:
            audio = MP3(file_path)
            duration = round(audio.info.length, 2)
        except Exception:
            duration = 180.0

        now = datetime.now(timezone.utc)
        doc = {
            "_id": ObjectId(),
            "title": meta["title"],
            "artist": meta["artist"],
            "album": meta["album"],
            "genre": meta["genre"],
            "duration": duration,
            "audio_file_key": f"songs/{filename}",
            "cover_image_key": None,
            "local_path": str(p.resolve()),
            "uploaded_by": user_id,
            "created_at": now,
            "updated_at": now,
            "play_count": 0,
            "is_public": True,
        }
        db.songs.insert_one(doc)
        print(f"Seeded: {meta['title']} ({meta['artist']}) - {duration}s")

    count = db.songs.count_documents({})
    print(f"Total songs in database: {count}")

if __name__ == "__main__":
    seed_songs()
