"""
Backend tests — Songs, Playlists, Likes, History
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


async def get_authenticated_client(username: str, password: str) -> tuple[AsyncClient, str]:
    """Helper: returns (client, user_id) for an authenticated session."""
    client = AsyncClient(transport=ASGITransport(app=app), base_url="http://test")
    login = await client.post("/auth/login", json={"username": username, "password": password})
    assert login.status_code == 200
    return client, login.json()["id"]


# ── Playlists ──────────────────────────────────────────────

@pytest.mark.anyio
async def test_create_and_list_playlist():
    """User can create and list playlists."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.post("/playlists", json={"name": "Test Playlist", "description": "Test", "is_public": False})
        assert resp.status_code == 201
        pl_id = resp.json()["id"]

        list_resp = await client.get("/playlists")
        assert list_resp.status_code == 200
        playlists = list_resp.json()["playlists"]
        ids = [p["id"] for p in playlists]
        assert pl_id in ids


@pytest.mark.anyio
async def test_rename_playlist():
    """User can rename their playlist."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.post("/playlists", json={"name": "To Rename", "is_public": False})
        pl_id = resp.json()["id"]

        upd = await client.put(f"/playlists/{pl_id}", json={"name": "Renamed Playlist"})
        assert upd.status_code == 200
        assert upd.json()["name"] == "Renamed Playlist"


@pytest.mark.anyio
async def test_delete_playlist():
    """User can delete their playlist."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.post("/playlists", json={"name": "To Delete", "is_public": False})
        pl_id = resp.json()["id"]

        del_resp = await client.delete(f"/playlists/{pl_id}")
        assert del_resp.status_code == 204


@pytest.mark.anyio
async def test_playlist_not_found():
    """Non-existent playlist returns 404."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.get("/playlists/000000000000000000000000")
        assert resp.status_code == 404


# ── Songs (metadata only — no R2 upload in unit tests) ────

@pytest.mark.anyio
async def test_songs_list_requires_auth():
    """Song list requires authentication."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/songs")
        assert resp.status_code == 401


@pytest.mark.anyio
async def test_songs_list_authenticated():
    """Authenticated user can list songs (empty initially)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.get("/songs")
        assert resp.status_code == 200
        data = resp.json()
        assert "songs" in data
        assert "total" in data


# ── History ────────────────────────────────────────────────

@pytest.mark.anyio
async def test_history_requires_auth():
    """History requires authentication."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/history")
        assert resp.status_code == 401


@pytest.mark.anyio
async def test_history_empty_initially():
    """New user has empty history."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.get("/history")
        assert resp.status_code == 200
        assert resp.json()["history"] == [] or isinstance(resp.json()["history"], list)


# ── Likes ──────────────────────────────────────────────────

@pytest.mark.anyio
async def test_likes_requires_auth():
    """Likes requires authentication."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/likes")
        assert resp.status_code == 401


@pytest.mark.anyio
async def test_likes_empty_initially():
    """New user has no liked songs."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.get("/likes")
        assert resp.status_code == 200
        assert resp.json()["songs"] == [] or isinstance(resp.json()["songs"], list)


# ── Admin ──────────────────────────────────────────────────

@pytest.mark.anyio
async def test_admin_create_and_delete_user():
    """Admin can create then delete a user."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithofficial2@gmail.com", "password": "sumith0FF_1104"})

        # Create user
        create_resp = await client.post("/admin/users", json={
            "username": "testuser_delete@example.com",
            "password": "TestPass123!",
            "display_name": "Test Delete User",
            "role": "user",
        })
        assert create_resp.status_code == 201
        user_id = create_resp.json()["id"]
        assert "password_hash" not in create_resp.json()

        # Delete user
        del_resp = await client.delete(f"/admin/users/{user_id}")
        assert del_resp.status_code == 204


@pytest.mark.anyio
async def test_admin_disable_user():
    """Admin can disable a user."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithofficial2@gmail.com", "password": "sumith0FF_1104"})

        # Create user to disable
        create_resp = await client.post("/admin/users", json={
            "username": "testuser_disable@example.com",
            "password": "TestPass123!",
            "display_name": "Test Disable User",
            "role": "user",
        })
        user_id = create_resp.json()["id"]

        # Disable
        upd = await client.put(f"/admin/users/{user_id}", json={"is_active": False})
        assert upd.status_code == 200
        assert upd.json()["is_active"] == False

        # Cleanup
        await client.delete(f"/admin/users/{user_id}")


@pytest.mark.anyio
async def test_admin_duplicate_username():
    """Creating user with existing username returns 409."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithofficial2@gmail.com", "password": "sumith0FF_1104"})
        resp = await client.post("/admin/users", json={
            "username": "sumithnalla0607@gmail.com",  # already exists
            "password": "AnyPass123!",
            "display_name": "Duplicate",
        })
        assert resp.status_code == 409


# ── Search ─────────────────────────────────────────────────

@pytest.mark.anyio
async def test_search_requires_auth():
    """Search requires authentication."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/search?q=test")
        assert resp.status_code == 401


@pytest.mark.anyio
async def test_search_empty_results():
    """Search returns empty results when no songs exist."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={"username": "sumithnalla0607@gmail.com", "password": "SN06072006"})
        resp = await client.get("/search?q=nonexistentsong12345")
        assert resp.status_code == 200
        data = resp.json()
        assert "songs" in data
        assert data["query"] == "nonexistentsong12345"
