"""JWT token creation and verification."""
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt

from app.config import get_settings


def create_access_token(data: dict[str, Any]) -> str:
    """Create a signed JWT access token."""
    settings = get_settings()
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    payload.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and verify a JWT token. Raises JWTError on failure."""
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
