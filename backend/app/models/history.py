"""History Pydantic schemas."""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class HistoryCreate(BaseModel):
    song_id: str
    seconds_played: float = Field(..., ge=0)
    completed: bool = False
