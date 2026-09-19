"""Admin routes — user management (admin only)."""
import logging
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, HTTPException, Query, status

from app.auth.dependencies import AdminUser
from app.auth.password import hash_password
from app.database import get_database
from app.models.user import UserCreate, UserUpdate
from app.models.utils import serialize_doc, serialize_docs

log = logging.getLogger(__name__)
router = APIRouter(prefix="/admin", tags=["admin"])


def safe_user(user: dict) -> dict:
    """Return user document without sensitive fields."""
    if not user:
        return None
    doc = serialize_doc(user)
    doc.pop("password_hash", None)
    return doc


@router.get("/users")
async def list_users(
    admin: AdminUser,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """List all users (admin only)."""
    db = get_database()
    skip = (page - 1) * limit
    cursor = db.users.find({}).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    total = await db.users.count_documents({})

    return {
        "users": [safe_user(u) for u in users],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
    }


@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(data: UserCreate, admin: AdminUser):
    """Create a new user account (admin only)."""
    db = get_database()

    # Check username uniqueness
    existing = await db.users.find_one({"username": data.username.lower().strip()})
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken")

    now = datetime.now(timezone.utc)
    user_doc = {
        "_id": ObjectId(),
        "username": data.username.lower().strip(),
        "password_hash": hash_password(data.password),
        "display_name": data.display_name.strip(),
        "role": data.role,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "last_login": None,
    }
    await db.users.insert_one(user_doc)
    log.info("Admin %s created user: %s", admin["username"], data.username)

    return safe_user(user_doc)


@router.get("/users/{user_id}")
async def get_user(user_id: str, admin: AdminUser):
    """Get a specific user by ID (admin only)."""
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return safe_user(user)


@router.put("/users/{user_id}")
async def update_user(user_id: str, updates: UserUpdate, admin: AdminUser):
    """Update a user (disable, change role, rename) — admin only."""
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = {k: v for k, v in updates.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.now(timezone.utc)
        await db.users.update_one({"_id": oid}, {"$set": update_data})

    log.info("Admin %s updated user %s: %s", admin["username"], user_id, list(update_data.keys()))

    updated = await db.users.find_one({"_id": oid})
    return safe_user(updated)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, admin: AdminUser):
    """
    Delete a user and their data (admin only).
    - Deletes playlists
    - Deletes playlist_songs for their playlists
    - Deletes likes
    - Deletes listening history
    - Deletes user document
    Songs uploaded by user are NOT automatically deleted (they remain public).
    """
    db = get_database()
    try:
        oid = ObjectId(user_id)
    except Exception:
        raise HTTPException(status_code=404, detail="User not found")

    user = await db.users.find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting yourself
    if str(admin["_id"]) == str(oid):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    # Get user's playlists
    user_playlists = await db.playlists.find({"owner_id": oid}).to_list(length=1000)
    for pl in user_playlists:
        await db.playlist_songs.delete_many({"playlist_id": pl["_id"]})
    await db.playlists.delete_many({"owner_id": oid})

    # Delete likes and history
    await db.likes.delete_many({"user_id": oid})
    await db.listening_history.delete_many({"user_id": oid})

    # Delete user
    await db.users.delete_one({"_id": oid})
    log.info("Admin %s deleted user %s (%s)", admin["username"], user_id, user["username"])


@router.get("/stats")
async def get_stats(admin: AdminUser):
    """Get application statistics (admin only)."""
    db = get_database()
    return {
        "users": await db.users.count_documents({}),
        "active_users": await db.users.count_documents({"is_active": True}),
        "songs": await db.songs.count_documents({}),
        "playlists": await db.playlists.count_documents({}),
        "total_plays": await db.listening_history.count_documents({}),
    }
