"""Application configuration using pydantic-settings."""
from functools import lru_cache
from typing import List

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # MongoDB
    mongodb_uri: str
    mongodb_database: str = "spotify_clone"

    @field_validator("mongodb_uri", mode="before")
    @classmethod
    def sanitize_mongodb_uri(cls, v: str) -> str:
        if isinstance(v, str):
            v = v.strip().strip("'\"").strip()
            import re
            # Clean any trailing newlines or junk attached to query parameters like w=majority
            v = re.sub(r'w=majority[^\s&]*', 'w=majority', v)
            return v
        return v

    @field_validator("mongodb_database", "jwt_secret", "allowed_origins", mode="before")
    @classmethod
    def sanitize_strings(cls, v: str) -> str:
        if isinstance(v, str):
            return v.strip().strip("'\"").strip()
        return v

    # JWT
    jwt_secret: str
    jwt_expire_days: int = 7
    jwt_algorithm: str = "HS256"

    # Cloudflare R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket_name: str = "spotify-clone-media"
    r2_endpoint_url: str = ""

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Storage provider: "gridfs" (active) | "r2" (future) | "local" (dev fallback)
    storage_provider: str = "gridfs"

    # App
    environment: str = "development"
    max_audio_size_mb: int = 50
    max_cover_size_mb: int = 5

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @property
    def max_audio_size_bytes(self) -> int:
        return self.max_audio_size_mb * 1024 * 1024

    @property
    def max_cover_size_bytes(self) -> int:
        return self.max_cover_size_mb * 1024 * 1024


@lru_cache
def get_settings() -> Settings:
    return Settings()
