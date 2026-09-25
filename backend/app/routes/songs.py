"""Songs routes: CRUD, upload, streaming.

Storage is handled through the configured provider (GridFS / R2 / Local).
The frontend is completely unaware of which provider is active.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, File, Form, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import StreamingResponse, Response

from app.auth.dependencies import CurrentUser
from app.config import get_settings
from app.database import get_database
from app.models.song import SongUpdate
from app.models.utils import serialize_doc, serialize_docs
from app.services import audio as audio_svc
from app.services.storage import get_storage_provider

log = logging.getLogger(__name__)
router = APIRouter(prefix="/songs", tags=["songs"])


# ---------------------------------------------------------------------------
# LIST
# ---------------------------------------------------------------------------

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
    sort_dir = -1
    sort_field = {"created_at": "created_at", "play_count": "play_count", "title": "title"}.get(sort, "created_at")
    if sort == "title":
        sort_dir = 1

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


# ---------------------------------------------------------------------------
# UPLOAD
# ---------------------------------------------------------------------------

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
    """Upload a new song (MP3 + optional cover image) via the configured storage provider."""
    settings = get_settings()
    provider = get_storage_provider()

    # Validate audio
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

    duration = audio_svc.get_audio_duration(audio_bytes) or 0.0

    song_id = str(uuid.uuid4())
    audio_key = f"songs/{song_id}.mp3"

    # Upload audio via provider
    storage_ref = await provider.upload_audio(audio_bytes, audio_key, "audio/mpeg")

    # Upload cover image if provided
    cover_storage_ref: Optional[str] = None
    cover_key: Optional[str] = None
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
            cover_storage_ref = await provider.upload_cover(cover_bytes, cover_key, content_type)

    # Build MongoDB document
    now = datetime.now(timezone.utc)
    song_doc = {
        "_id": ObjectId(),
        "title": title.strip(),
        "artist": artist.strip(),
        "album": album.strip() if album else None,
        "genre": genre.strip() if genre else None,
        "duration": duration,
        # Provider-neutral storage refs (active)
        "storage_ref": storage_ref,
        "cover_storage_ref": cover_storage_ref,
        # Legacy keys preserved for backward compat / R2 future use
        "audio_file_key": audio_key,
        "cover_image_key": cover_key,
        "uploaded_by": current_user["_id"],
        "created_at": now,
        "updated_at": now,
        "play_count": 0,
        "is_public": True,
    }

    db = get_database()
    await db.songs.insert_one(song_doc)
    log.info(
        "Song uploaded via %s: %s by %s (ref=%s)",
        settings.storage_provider, title, current_user["username"], storage_ref,
    )
    return serialize_doc(song_doc)


# ---------------------------------------------------------------------------
# GET METADATA
# ---------------------------------------------------------------------------

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


# ---------------------------------------------------------------------------
# STREAM URL (returns URL the player should use)
# ---------------------------------------------------------------------------

@router.get("/{song_id}/stream")
async def get_stream_url(song_id: str, current_user: CurrentUser):
    """
    Return the URL the frontend audio element should load.

    - GridFS / Local → returns /api/songs/{id}/audio  (served by this backend)
    - R2             → returns a presigned R2 URL      (frontend hits R2 directly)
    """
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid, "is_public": True})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    settings = get_settings()
    stream_url: str

    if settings.storage_provider == "r2":
        # R2: return presigned URL
        from app.services.storage.r2_provider import R2Provider
        provider = R2Provider()
        storage_ref = song.get("storage_ref") or f"r2-audio:{song.get('audio_file_key', '')}"
        presigned = provider.get_presigned_audio_url(storage_ref, expires_in=3600)
        stream_url = presigned or f"/api/songs/{song_id}/audio"
    else:
        # GridFS / Local: serve through our streaming endpoint
        stream_url = f"/api/songs/{song_id}/audio"

    # Increment play count
    await db.songs.update_one({"_id": oid}, {"$inc": {"play_count": 1}})

    return {"stream_url": stream_url, "expires_in": 3600, "song_id": song_id}


# ---------------------------------------------------------------------------
# AUDIO STREAMING ENDPOINT (GridFS + Local)
# ---------------------------------------------------------------------------

@router.get("/{song_id}/audio")
async def stream_audio_file(song_id: str, request: Request):
    """
    Stream audio with HTTP Range request support.

    Supports:
      - seek forward/backward
      - pause/resume
      - browser progress bar scrubbing
      - play from any position
    """
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    range_header = request.headers.get("Range")
    settings = get_settings()
    storage_ref: Optional[str] = song.get("storage_ref")

    # --- Determine effective provider and ref ---
    # Fallback chain: storage_ref → local_path → legacy audio_file_key
    if not storage_ref:
        # Song predates storage abstraction — derive ref from legacy fields
        local_path = song.get("local_path")
        if local_path:
            storage_ref = f"local-audio:{local_path}"
        else:
            # Try scanning songs/ directory (original seed approach)
            from pathlib import Path
            key = song.get("audio_file_key", "")
            filename = Path(key).name
            for candidate in [
                Path("..") / "songs" / filename,
                Path("songs") / filename,
            ]:
                if candidate.exists():
                    storage_ref = f"local-audio:{candidate.resolve()}"
                    break

    if not storage_ref:
        raise HTTPException(status_code=404, detail="Audio file not found — no storage reference")

    # Resolve provider from ref prefix (ignores STORAGE_PROVIDER env for streaming —
    # the ref itself tells us where the file is stored)
    if storage_ref.startswith("gridfs-audio:"):
        from app.services.storage.gridfs_provider import GridFSProvider
        provider = GridFSProvider()
    elif storage_ref.startswith("r2-audio:"):
        # R2 audio is delivered via presigned URL, not this endpoint
        raise HTTPException(
            status_code=400,
            detail="R2 audio is delivered via presigned URL. Use /stream endpoint.",
        )
    else:
        from app.services.storage.local_provider import LocalProvider
        provider = LocalProvider()

    generator, start, end, total_size, content_type = await provider.stream_audio(
        storage_ref, range_header
    )

    content_length = end - start + 1
    is_range = range_header is not None and range_header.startswith("bytes=")
    status_code = 206 if is_range else 200

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(content_length),
        "Content-Type": content_type,
        "Cache-Control": "public, max-age=86400",
    }
    if is_range:
        headers["Content-Range"] = f"bytes {start}-{end}/{total_size}"

    return StreamingResponse(
        generator,
        status_code=status_code,
        headers=headers,
        media_type=content_type,
    )


# ---------------------------------------------------------------------------
# COVER IMAGE
# ---------------------------------------------------------------------------

@router.get("/{song_id}/cover")
async def get_cover_url(song_id: str, current_user: CurrentUser):
    """Return the URL for the song's cover image."""
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    settings = get_settings()

    if settings.storage_provider == "r2":
        from app.services.storage.r2_provider import R2Provider
        provider = R2Provider()
        cover_ref = song.get("cover_storage_ref") or f"r2-cover:{song.get('cover_image_key', '')}"
        if song.get("cover_image_key") or song.get("cover_storage_ref"):
            url = provider.get_presigned_cover_url(cover_ref)
            if url:
                return {"cover_url": url, "expires_in": 3600}

    # GridFS / Local → serve via /cover/image
    if song.get("cover_storage_ref") or song.get("local_cover_path"):
        return {"cover_url": f"/api/songs/{song_id}/cover/image", "expires_in": 3600}

    raise HTTPException(status_code=404, detail="Cover image not found")


@router.get("/{song_id}/cover/image")
async def get_cover_image_file(song_id: str):
    """Serve cover image directly from GridFS or local filesystem."""
    db = get_database()
    try:
        oid = ObjectId(song_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Song not found")

    song = await db.songs.find_one({"_id": oid})
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")

    cover_ref: Optional[str] = song.get("cover_storage_ref")

    if not cover_ref:
        # Legacy: local_cover_path
        local_cover = song.get("local_cover_path")
        if local_cover:
            cover_ref = f"local-cover:{local_cover}"

    if not cover_ref:
        raise HTTPException(status_code=404, detail="Cover image not found")

    if cover_ref.startswith("gridfs-cover:"):
        from app.services.storage.gridfs_provider import GridFSProvider
        provider = GridFSProvider()
    else:
        from app.services.storage.local_provider import LocalProvider
        provider = LocalProvider()

    image_bytes, content_type = await provider.get_cover_bytes(cover_ref)
    return Response(content=image_bytes, media_type=content_type)


# ---------------------------------------------------------------------------
# UPDATE METADATA
# ---------------------------------------------------------------------------

@router.put("/{song_id}")
async def update_song(song_id: str, updates: SongUpdate, current_user: CurrentUser):
    """Update song metadata (owner, admin, or authenticated user)."""
    try:
        db = get_database()
        try:
            oid = ObjectId(song_id)
        except Exception:
            raise HTTPException(status_code=404, detail="Song not found")

        song = await db.songs.find_one({"_id": oid})
        if not song:
            raise HTTPException(status_code=404, detail="Song not found")

        update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
        if update_data:
            update_data["updated_at"] = datetime.now(timezone.utc)
            await db.songs.update_one({"_id": oid}, {"$set": update_data})

        updated = await db.songs.find_one({"_id": oid})
        return serialize_doc(updated)
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        log.error("Error in update_song: %s", traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Update failed: {str(e)}",
        )


# ---------------------------------------------------------------------------
# DELETE
# ---------------------------------------------------------------------------

@router.delete("/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_song(song_id: str, current_user: CurrentUser):
    """
    Delete a song completely:
    - Delete audio from storage provider (GridFS / R2 / Local)
    - Delete cover from storage provider
    - Remove from playlist_songs
    - Remove likes
    - Preserve listening_history (song_id kept as orphan reference)
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

    is_owner = str(song["uploaded_by"]) == str(current_user["_id"])
    is_admin = current_user.get("role") == "admin"
    if not is_owner and not is_admin:
        raise HTTPException(status_code=403, detail="Forbidden")

    # Delete audio from whichever provider stored it
    storage_ref = song.get("storage_ref")
    if storage_ref:
        provider = _provider_from_ref(storage_ref)
        try:
            await provider.delete_audio(storage_ref)
        except Exception as e:
            log.error("Failed to delete audio storage ref %s: %s", storage_ref, e)

    # Delete cover
    cover_ref = song.get("cover_storage_ref")
    if cover_ref:
        provider = _provider_from_ref(cover_ref)
        try:
            await provider.delete_cover(cover_ref)
        except Exception as e:
            log.error("Failed to delete cover storage ref %s: %s", cover_ref, e)

    # Clean up relations
    await db.playlist_songs.delete_many({"song_id": oid})
    await db.likes.delete_many({"song_id": oid})

    # Delete song document
    await db.songs.delete_one({"_id": oid})
    log.info("Song deleted: %s by %s", song_id, current_user["username"])


# ---------------------------------------------------------------------------
# Internal helper
# ---------------------------------------------------------------------------

def _provider_from_ref(storage_ref: str):
    """Pick the correct provider based on the storage_ref prefix."""
    if storage_ref.startswith("gridfs-"):
        from app.services.storage.gridfs_provider import GridFSProvider
        return GridFSProvider()
    if storage_ref.startswith("r2-"):
        from app.services.storage.r2_provider import R2Provider
        return R2Provider()
    from app.services.storage.local_provider import LocalProvider
    return LocalProvider()
