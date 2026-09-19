"""Search routes."""
import logging

from fastapi import APIRouter, HTTPException, Query

from app.auth.dependencies import CurrentUser
from app.database import get_database
from app.models.utils import serialize_docs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
async def search_songs(
    current_user: CurrentUser,
    q: str = Query(..., min_length=1, max_length=200),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Search songs by title, artist, album, genre.
    Uses MongoDB full-text search index.
    """
    db = get_database()

    if not q.strip():
        return {"songs": [], "total": 0, "query": q}

    # Use MongoDB text search
    cursor = db.songs.find(
        {
            "$text": {"$search": q},
            "is_public": True,
        },
        {"score": {"$meta": "textScore"}},
    ).sort([("score", {"$meta": "textScore"})]).limit(limit)

    songs = await cursor.to_list(length=limit)
    serialized = serialize_docs(songs)

    return {
        "songs": serialized,
        "total": len(serialized),
        "query": q,
    }
