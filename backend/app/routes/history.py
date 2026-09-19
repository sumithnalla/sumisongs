"""Listening history routes."""
import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import CurrentUser
from app.database import get_database
from app.models.history import HistoryCreate
from app.models.utils import serialize_doc, serialize_docs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
async def get_history(
    current_user: CurrentUser,
    limit: int = Query(50, ge=1, le=200),
):
    """Get listening history for the current user (most recent first)."""
    db = get_database()
    cursor = (
        db.listening_history
        .find({"user_id": current_user["_id"]})
        .sort("played_at", -1)
        .limit(limit)
    )
    history = await cursor.to_list(length=limit)

    result = []
    for h in history:
        song = None
        if h.get("song_id"):
            song = await db.songs.find_one({"_id": h["song_id"]})

        entry = {
            "id": str(h["_id"]),
            "song": serialize_doc(song) if song else None,
            "played_at": h["played_at"],
            "seconds_played": h["seconds_played"],
            "completed": h["completed"],
        }
        result.append(entry)

    return {"history": result, "total": len(result)}


@router.post("", status_code=status.HTTP_201_CREATED)
async def record_play(data: HistoryCreate, current_user: CurrentUser):
    """Record a song play event. Call once per song (at end or threshold)."""
    db = get_database()
    try:
        song_oid = ObjectId(data.song_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid song ID")

    song = await db.songs.find_one({"_id": song_oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    history_doc = {
        "_id": ObjectId(),
        "user_id": current_user["_id"],
        "song_id": song_oid,
        "played_at": datetime.now(timezone.utc),
        "seconds_played": data.seconds_played,
        "completed": data.completed,
    }
    await db.listening_history.insert_one(history_doc)
    return {"message": "Play recorded"}


@router.get("/recently-played")
async def get_recently_played(
    current_user: CurrentUser,
    limit: int = Query(20, ge=1, le=50),
):
    """Get recently played songs (deduplicated — one entry per song)."""
    db = get_database()

    # Aggregate: most recent play per song
    pipeline = [
        {"$match": {"user_id": current_user["_id"]}},
        {"$sort": {"played_at": -1}},
        {"$group": {
            "_id": "$song_id",
            "played_at": {"$first": "$played_at"},
            "seconds_played": {"$first": "$seconds_played"},
            "completed": {"$first": "$completed"},
        }},
        {"$sort": {"played_at": -1}},
        {"$limit": limit},
    ]

    cursor = db.listening_history.aggregate(pipeline)
    entries = await cursor.to_list(length=limit)

    result = []
    for entry in entries:
        song = await db.songs.find_one({"_id": entry["_id"]})
        if song:
            result.append({
                "song": serialize_doc(song),
                "played_at": entry["played_at"],
            })

    return {"songs": result, "total": len(result)}
