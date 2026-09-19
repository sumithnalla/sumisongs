"""Song Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class SongCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    artist: str = Field(..., min_length=1, max_length=200)
    album: Optional[str] = Field(None, max_length=200)
    genre: Optional[str] = Field(None, max_length=100)


class SongUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    artist: Optional[str] = Field(None, min_length=1, max_length=200)
    album: Optional[str] = Field(None, max_length=200)
    genre: Optional[str] = Field(None, max_length=100)
    is_public: Optional[bool] = None


class SongResponse(BaseModel):
    id: str
    title: str
    artist: str
    album: Optional[str] = None
    genre: Optional[str] = None
    duration: float
    # Legacy fields (kept for backward compat / R2 future use)
    audio_file_key: Optional[str] = None
    cover_image_key: Optional[str] = None
    # Provider-neutral storage references (active for GridFS / local)
    # Format: "gridfs-audio:<ObjectId>", "r2-audio:<key>", "local-audio:<path>"
    storage_ref: Optional[str] = None
    cover_storage_ref: Optional[str] = None
    uploaded_by: str
    created_at: datetime
    play_count: int
    is_public: bool


class StreamResponse(BaseModel):
    stream_url: str
    expires_in: int = 3600
