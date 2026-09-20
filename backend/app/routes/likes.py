"""Likes routes: like/unlike songs."""
import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, status

from app.auth.dependencies import CurrentUser
from app.database import get_database
from app.models.utils import serialize_doc, serialize_docs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/likes", tags=["likes"])


@router.get("")
async def get_liked_songs(current_user: CurrentUser):
    """Get all songs liked by the current user."""
    db = get_database()
    cursor = db.likes.find({"user_id": current_user["_id"]}).sort("created_at", -1)
    likes = await cursor.to_list(length=500)

    songs = []
    for like in likes:
        song = await db.songs.find_one({"_id": like["song_id"]})
        if song:
            song_doc = serialize_doc(song)
            song_doc["liked_at"] = like["created_at"]
            songs.append(song_doc)

    return {"songs": songs, "total": len(songs)}


@router.post("/{song_id}", status_code=status.HTTP_201_CREATED)
async def like_song(song_id: str, current_user: CurrentUser):
    """Like a song."""
    db = get_database()
    try:
        song_oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid song ID")

    song = await db.songs.find_one({"_id": song_oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    existing = await db.likes.find_one({"user_id": current_user["_id"], "song_id": song_oid})
    if existing:
        raise HTTPException(status_code=409, detail="Song already liked")

    like_doc = {
        "_id": ObjectId(),
        "user_id": current_user["_id"],
        "song_id": song_oid,
        "created_at": datetime.now(timezone.utc),
    }
    await db.likes.insert_one(like_doc)
    return {"message": "Song liked", "song_id": song_id}


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def unlike_song(song_id: str, current_user: CurrentUser):
    """Unlike a song."""
    db = get_database()
    try:
        song_oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid song ID")

    result = await db.likes.delete_one({"user_id": current_user["_id"], "song_id": song_oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Song not liked")


@router.get("/{song_id}/check")
@router.get("/{song_id}/status")
async def get_like_status(song_id: str, current_user: CurrentUser):
    """Check if the current user has liked a specific song."""
    db = get_database()
    try:
        song_oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid song ID")

    liked = await db.likes.find_one({"user_id": current_user["_id"], "song_id": song_oid})
    is_liked = liked is not None
    return {"liked": is_liked, "is_liked": is_liked, "song_id": song_id}
