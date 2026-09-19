"""Playlists routes: CRUD, song management."""
import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from app.auth.dependencies import CurrentUser
from app.database import get_database
from app.models.playlist import PlaylistCreate, PlaylistUpdate, PlaylistAddSong, PlaylistReorder
from app.models.utils import serialize_doc, serialize_docs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/playlists", tags=["playlists"])


@router.get("")
async def list_playlists(current_user: CurrentUser):
    """Get the current user's playlists."""
    db = get_database()
    cursor = db.playlists.find({"owner_id": current_user["_id"]}).sort("created_at", -1)
    playlists = await cursor.to_list(length=100)

    # Add song count to each playlist
    result = []
    for pl in playlists:
        count = await db.playlist_songs.count_documents({"playlist_id": pl["_id"]})
        doc = serialize_doc(pl)
        doc["song_count"] = count
        result.append(doc)

    return {"playlists": result}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_playlist(data: PlaylistCreate, current_user: CurrentUser):
    """Create a new playlist."""
    db = get_database()
    now = datetime.now(timezone.utc)
    playlist = {
        "_id": ObjectId(),
        "name": data.name.strip(),
        "description": data.description,
        "owner_id": current_user["_id"],
        "cover_image_key": None,
        "is_public": data.is_public,
        "created_at": now,
        "updated_at": now,
    }
    await db.playlists.insert_one(playlist)
    return serialize_doc(playlist)


@router.get("/{playlist_id}")
async def get_playlist(playlist_id: str, current_user: CurrentUser):
    """Get playlist with its songs."""
    db = get_database()
    try:
        oid = ObjectId(playlist_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Playlist not found")

    playlist = await db.playlists.find_one({"_id": oid})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Authorization: owner or public playlist
    is_owner = str(playlist["owner_id"]) == str(current_user["_id"])
    is_admin = current_user.get("role") == "admin"
    if not is_owner and not playlist.get("is_public") and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Fetch songs in order
    ps_cursor = db.playlist_songs.find({"playlist_id": oid}).sort("position", 1)
    playlist_songs = await ps_cursor.to_list(length=500)

    songs = []
    for ps in playlist_songs:
        song = await db.songs.find_one({"_id": ps["song_id"]})
        if song:
            song_doc = serialize_doc(song)
            song_doc["position"] = ps["position"]
            songs.append(song_doc)

    result = serialize_doc(playlist)
    result["songs"] = songs
    result["song_count"] = len(songs)
    return result


@router.put("/{playlist_id}")
async def update_playlist(playlist_id: str, updates: PlaylistUpdate, current_user: CurrentUser):
    """Update playlist name/description."""
    db = get_database()
    try:
        oid = ObjectId(playlist_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Playlist not found")

    playlist = await db.playlists.find_one({"_id": oid})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if str(playlist["owner_id"]) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.playlists.update_one({"_id": oid}, {"$set": update_data})

    updated = await db.playlists.find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{playlist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_playlist(playlist_id: str, current_user: CurrentUser):
    """Delete a playlist and its song relationships."""
    db = get_database()
    try:
        oid = ObjectId(playlist_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Playlist not found")

    playlist = await db.playlists.find_one({"_id": oid})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if str(playlist["owner_id"]) != str(current_user["_id"]) and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    await db.playlist_songs.delete_many({"playlist_id": oid})
    await db.playlists.delete_one({"_id": oid})


@router.post("/{playlist_id}/songs", status_code=status.HTTP_201_CREATED)
async def add_song_to_playlist(playlist_id: str, data: PlaylistAddSong, current_user: CurrentUser):
    """Add a song to a playlist."""
    db = get_database()
    try:
        pl_oid = ObjectId(playlist_id)
        song_oid = ObjectId(data.song_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    playlist = await db.playlists.find_one({"_id": pl_oid})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if str(playlist["owner_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    song = await db.songs.find_one({"_id": song_oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Check for duplicates
    existing = await db.playlist_songs.find_one({"playlist_id": pl_oid, "song_id": song_oid})
    if existing:
        raise HTTPException(status_code=409, detail="Song already in playlist")

    # Get next position
    last = await db.playlist_songs.find_one(
        {"playlist_id": pl_oid}, sort=[("position", -1)]
    )
    position = (last["position"] + 1) if last else 0

    ps_doc = {
        "_id": ObjectId(),
        "playlist_id": pl_oid,
        "song_id": song_oid,
        "position": position,
        "added_at": datetime.now(timezone.utc),
    }
    await db.playlist_songs.insert_one(ps_doc)

    # Update playlist updated_at
    await db.playlists.update_one({"_id": pl_oid}, {"$set": {"updated_at": datetime.now(timezone.utc)}})

    return {"message": "Song added to playlist", "position": position}


@router.delete("/{playlist_id}/songs/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_song_from_playlist(playlist_id: str, song_id: str, current_user: CurrentUser):
    """Remove a song from a playlist."""
    db = get_database()
    try:
        pl_oid = ObjectId(playlist_id)
        song_oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid ID format")

    playlist = await db.playlists.find_one({"_id": pl_oid})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if str(playlist["owner_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    result = await db.playlist_songs.delete_one({"playlist_id": pl_oid, "song_id": song_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Song not in playlist")

    # Re-index positions
    remaining = await db.playlist_songs.find({"playlist_id": pl_oid}).sort("position", 1).to_list(length=500)
    for i, ps in enumerate(remaining):
        await db.playlist_songs.update_one({"_id": ps["_id"]}, {"$set": {"position": i}})


@router.put("/{playlist_id}/songs/reorder")
async def reorder_playlist_songs(playlist_id: str, data: PlaylistReorder, current_user: CurrentUser):
    """Reorder songs in a playlist by providing the ordered list of song IDs."""
    db = get_database()
    try:
        pl_oid = ObjectId(playlist_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid playlist ID")

    playlist = await db.playlists.find_one({"_id": pl_oid})
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    if str(playlist["owner_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Forbidden")

    for i, song_id in enumerate(data.song_ids):
        try:
            song_oid = ObjectId(song_id)
            await db.playlist_songs.update_one(
                {"playlist_id": pl_oid, "song_id": song_oid},
                {"$set": {"position": i}},
            )
        except Exception:
            continue

    return {"message": "Playlist reordered"}
