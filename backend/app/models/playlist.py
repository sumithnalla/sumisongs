"""Playlist Pydantic schemas."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PlaylistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    is_public: bool = False


class PlaylistUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=500)
    is_public: Optional[bool] = None


class PlaylistAddSong(BaseModel):
    song_id: str


class PlaylistReorder(BaseModel):
    song_ids: List[str]  # ordered list of song IDs


class PlaylistResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    cover_image_key: Optional[str] = None
    is_public: bool
    created_at: datetime
    updated_at: datetime
    song_count: int = 0
