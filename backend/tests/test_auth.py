"""
Backend tests — Authentication
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

from app.main import app


@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_login_valid_user():
    """Valid user login returns 200 with user data."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/auth/login", json={
            "username": "sumithnalla0607@gmail.com",
            "password": "SN06072006",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "sumithnalla0607@gmail.com"
    assert data["role"] == "user"
    assert "password_hash" not in data
    assert "access_token" in resp.cookies


@pytest.mark.anyio
async def test_login_valid_admin():
    """Valid admin login returns 200 with admin role."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/auth/login", json={
            "username": "sumithofficial2@gmail.com",
            "password": "sumith0FF_1104",
        })
    assert resp.status_code == 200
    data = resp.json()
    assert data["role"] == "admin"


@pytest.mark.anyio
async def test_login_wrong_password():
    """Wrong password returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/auth/login", json={
            "username": "sumithnalla0607@gmail.com",
            "password": "wrongpassword123",
        })
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


@pytest.mark.anyio
async def test_login_nonexistent_user():
    """Non-existent user returns 401 (same error as wrong password)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.post("/auth/login", json={
            "username": "doesnotexist@nowhere.com",
            "password": "anypassword",
        })
    assert resp.status_code == 401
    assert resp.json()["detail"] == "Invalid credentials"


@pytest.mark.anyio
async def test_auth_me_unauthenticated():
    """Unauthenticated /auth/me returns 401."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_auth_me_authenticated():
    """Authenticated /auth/me returns current user."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        login = await client.post("/auth/login", json={
            "username": "sumithnalla0607@gmail.com",
            "password": "SN06072006",
        })
        assert login.status_code == 200
        resp = await client.get("/auth/me")
    assert resp.status_code == 200
    data = resp.json()
    assert data["username"] == "sumithnalla0607@gmail.com"
    assert "password_hash" not in data


@pytest.mark.anyio
async def test_logout():
    """Logout clears authentication."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={
            "username": "sumithnalla0607@gmail.com",
            "password": "SN06072006",
        })
        logout = await client.post("/auth/logout")
        assert logout.status_code == 200
        # After logout, /auth/me should fail
        resp = await client.get("/auth/me")
    assert resp.status_code == 401


@pytest.mark.anyio
async def test_admin_endpoint_forbidden_for_regular_user():
    """Regular user cannot access admin endpoints (403)."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={
            "username": "sumithnalla0607@gmail.com",
            "password": "SN06072006",
        })
        resp = await client.get("/admin/users")
    assert resp.status_code == 403


@pytest.mark.anyio
async def test_admin_endpoint_accessible_for_admin():
    """Admin can access admin endpoints."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={
            "username": "sumithofficial2@gmail.com",
            "password": "sumith0FF_1104",
        })
        resp = await client.get("/admin/users")
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    # Verify no password hashes are returned
    for user in data["users"]:
        assert "password_hash" not in user


@pytest.mark.anyio
async def test_admin_stats():
    """Admin can view stats."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        await client.post("/auth/login", json={
            "username": "sumithofficial2@gmail.com",
            "password": "sumith0FF_1104",
        })
        resp = await client.get("/admin/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert data["users"] >= 2  # at least our seed accounts


@pytest.mark.anyio
async def test_health_check():
    """Health check returns ok."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["database"] == "ok"
