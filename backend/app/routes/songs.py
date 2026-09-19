"""Songs routes: CRUD, upload, streaming."""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status

from app.auth.dependencies import CurrentUser
from app.config import get_settings
from app.database import get_database
from app.models.song import SongUpdate, StreamResponse
from app.models.utils import serialize_doc, serialize_docs
from app.services import audio as audio_svc
from app.services import r2 as r2_svc

log = logging.getLogger(__name__)
router = APIRouter(prefix="/songs", tags=["songs"])


@router.get("")
async def list_songs(
    current_user: CurrentUser,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("created_at", pattern="^(created_at|play_count|title)$"),
):
    """List public songs with pagination."""
    db = get_database()
    skip = (page - 1) * limit
    sort_dir = -1  # descending by default

    sort_field = {
        "created_at": "created_at",
        "play_count": "play_count",
        "title": "title",
    }.get(sort, "created_at")

    if sort == "title":
        sort_dir = 1  # ascending for title

    cursor = db.songs.find({"is_public": True}).sort(sort_field, sort_dir).skip(skip).limit(limit)
    songs = await cursor.to_list(length=limit)
    total = await db.songs.count_documents({"is_public": True})

    return {
        "songs": serialize_docs(songs),
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_song(
    current_user: CurrentUser,
    file: UploadFile = File(...),
    cover: Optional[UploadFile] = File(None),
    title: str = Form(..., min_length=1, max_length=200),
    artist: str = Form(..., min_length=1, max_length=200),
    album: Optional[str] = Form(None),
    genre: Optional[str] = Form(None),
):
    """Upload a new song (MP3 + optional cover image)."""
    settings = get_settings()

    # Validate audio file
    audio_bytes = await file.read()
    if len(audio_bytes) > settings.max_audio_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Audio file too large. Max: {settings.max_audio_size_mb}MB",
        )
    if not audio_svc.is_valid_mp3(audio_bytes):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only MP3 audio files are accepted.",
        )

    # Extract duration
    duration = audio_svc.get_audio_duration(audio_bytes)
    if duration is None:
        duration = 0.0

    # Generate unique song ID
    song_id = str(uuid.uuid4())
    audio_key = f"songs/{song_id}.mp3"
    cover_key = None
    local_audio_path = None
    local_cover_path = None

    # Upload audio to R2 or save locally if R2 not configured
    r2_client = r2_svc.get_r2_client()
    if r2_client is not None:
        await r2_svc.upload_file_to_r2(audio_bytes, audio_key, "audio/mpeg")
    else:
        from pathlib import Path
        upload_dir = Path("uploads/songs")
        upload_dir.mkdir(parents=True, exist_ok=True)
        local_file = upload_dir / f"{song_id}.mp3"
        local_file.write_bytes(audio_bytes)
        local_audio_path = str(local_file)

    # Upload cover image if provided
    if cover and cover.filename:
        cover_bytes = await cover.read()
        if len(cover_bytes) > settings.max_cover_size_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Cover image too large. Max: {settings.max_cover_size_mb}MB",
            )
        if audio_svc.is_valid_image(cover_bytes):
            content_type = audio_svc.get_image_content_type(cover_bytes)
            ext = "jpg" if "jpeg" in content_type else content_type.split("/")[1]
            cover_key = f"covers/{song_id}.{ext}"
            if r2_client is not None:
                await r2_svc.upload_file_to_r2(cover_bytes, cover_key, content_type)
            else:
                from pathlib import Path
                cover_dir = Path("uploads/covers")
                cover_dir.mkdir(parents=True, exist_ok=True)
                cover_file = cover_dir / f"{song_id}.{ext}"
                cover_file.write_bytes(cover_bytes)
                local_cover_path = str(cover_file)

    # Create MongoDB document
    now = datetime.now(timezone.utc)
    song_doc = {
        "_id": ObjectId(),
        "title": title.strip(),
        "artist": artist.strip(),
        "album": album.strip() if album else None,
        "genre": genre.strip() if genre else None,
        "duration": duration,
        "audio_file_key": audio_key,
        "cover_image_key": cover_key,
        "local_path": local_audio_path,
        "local_cover_path": local_cover_path,
        "uploaded_by": current_user["_id"],
        "created_at": now,
        "updated_at": now,
        "play_count": 0,
        "is_public": True,
    }

    db = get_database()
    await db.songs.insert_one(song_doc)
    log.info("Song uploaded: %s by %s", title, current_user["username"])

    return serialize_doc(song_doc)


@router.get("/{song_id}")
async def get_song(song_id: str, current_user: CurrentUser):
    """Get song metadata by ID."""
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid, "is_public": True})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    return serialize_doc(song)


@router.get("/{song_id}/stream")
async def get_stream_url(song_id: str, current_user: CurrentUser):
    """Get a streaming URL for the song audio (presigned R2 or direct stream fallback)."""
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid, "is_public": True})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    stream_url = r2_svc.generate_presigned_url(song["audio_file_key"], expires_in=3600)
    if not stream_url:
        stream_url = f"/api/songs/{song_id}/audio"

    # Increment play count
    await db.songs.update_one({"_id": oid}, {"$inc": {"play_count": 1}})

    return {"stream_url": stream_url, "expires_in": 3600, "song_id": song_id}


@router.get("/{song_id}/audio")
async def stream_audio_file(song_id: str):
    """Stream audio file with HTTP range request support."""
    from fastapi.responses import FileResponse
    from pathlib import Path

    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Check local_path first
    local_path = song.get("local_path")
    if local_path and Path(local_path).exists():
        return FileResponse(local_path, media_type="audio/mpeg", filename=f"{song['title']}.mp3")

    # Fallback to songs directory
    key = song.get("audio_file_key", "")
    filename = Path(key).name
    # Try various relative locations
    for candidate in [
        Path("..") / "songs" / filename,
        Path("songs") / filename,
        Path("..") / key,
        Path(key),
    ]:
        if candidate.exists():
            return FileResponse(str(candidate), media_type="audio/mpeg", filename=f"{song['title']}.mp3")

    raise HTTPException(status_code=404, detail="Audio file not found on server")


@router.get("/{song_id}/cover")
async def get_cover_url(song_id: str, current_user: CurrentUser):
    """Get a presigned URL or direct route for the song cover image."""
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song or not song.get("cover_image_key"):
        raise HTTPException(status_code=404, detail="Cover image not found")

    cover_url = r2_svc.generate_presigned_url(song["cover_image_key"], expires_in=3600)
    if not cover_url:
        cover_url = f"/api/songs/{song_id}/cover/image"

    return {"cover_url": cover_url, "expires_in": 3600}


@router.get("/{song_id}/cover/image")
async def get_cover_image_file(song_id: str):
    """Serve cover image directly (local fallback)."""
    from fastapi.responses import FileResponse
    from pathlib import Path

    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    local_cover = song.get("local_cover_path")
    if local_cover and Path(local_cover).exists():
        return FileResponse(local_cover)

    raise HTTPException(status_code=404, detail="Cover image not found")


@router.put("/{song_id}")
async def update_song(song_id: str, updates: SongUpdate, current_user: CurrentUser):
    """Update song metadata (owner or admin only)."""
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Authorization: owner or admin
    is_owner = str(song["uploaded_by"]) == str(current_user["_id"])
    is_admin = current_user.get("role") == "admin"
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.songs.update_one({"_id": oid}, {"$set": update_data})

    updated = await db.songs.find_one({"_id": oid})
    return serialize_doc(updated)


@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_song(song_id: str, current_user: CurrentUser):
    """
    Delete a song completely:
    - Delete audio from R2
    - Delete cover from R2
    - Remove from playlist_songs
    - Remove likes
    - Retain listening_history (song_id kept as reference)
    - Delete MongoDB song document
    """
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    # Authorization: owner or admin
    is_owner = str(song["uploaded_by"]) == str(current_user["_id"])
    is_admin = current_user.get("role") == "admin"
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete R2 audio
    try:
        await r2_svc.delete_file_from_r2(song["audio_file_key"])
    except Exception as e:
        log.error("Failed to delete audio from R2: %s", e)

    # Delete R2 cover
    if song.get("cover_image_key"):
        try:
            await r2_svc.delete_file_from_r2(song["cover_image_key"])
        except Exception as e:
            log.error("Failed to delete cover from R2: %s", e)

    # Clean up relations
    await db.playlist_songs.delete_many({"song_id": oid})
    await db.likes.delete_many({"song_id": oid})
    # Preserve listening_history — keep for analytics but mark song deleted
    # (song_id remains as foreign key reference)

    # Delete song document
    await db.songs.delete_one({"_id": oid})
    log.info("Song deleted: %s by %s", song_id, current_user["username"])
