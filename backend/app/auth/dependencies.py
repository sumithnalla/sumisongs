"""FastAPI dependency injectors for authentication and authorization."""
import logging
from typing import Annotated

from bson import ObjectId
from fastapi import Cookie, Depends, HTTPException, status
from jose import JWTError

from app.auth.jwt import decode_access_token
from app.database import get_database

log = logging.getLogger(__name__)


async def get_current_user(
    access_token: Annotated[str | None, Cookie()] = None,
) -> dict:
    """
    Dependency: extracts and validates JWT from HTTP-only cookie.
    Returns the user document from MongoDB.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
    )

    if not access_token:
        raise credentials_exception

    try:
        payload = decode_access_token(access_token)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError as e:
        log.debug("JWT decode error: %s", e)
        raise credentials_exception

    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception

    if user is None:
        raise credentials_exception

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return user


async def require_admin(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    """
    Dependency: requires authenticated user with admin role.
    Always verified server-side — never rely on frontend role claims.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# Type aliases for cleaner route signatures
CurrentUser = Annotated[dict, Depends(get_current_user)]
AdminUser = Annotated[dict, Depends(require_admin)]
