# Spotify Clone — API Reference

## Base URL

- **Development:** `http://localhost:8000`
- **Production:** `https://<render-service>.onrender.com`

## Authentication

All protected endpoints require the `access_token` HTTP-only cookie set by `POST /auth/login`.

---

## Auth Endpoints

### `POST /auth/login`
Login and receive authentication cookie.

**Body:**
```json
{ "username": "email@example.com", "password": "secret" }
```

**Response 200:**
```json
{ "id": "...", "username": "...", "display_name": "...", "role": "user" }
```

**Errors:** `401` invalid credentials, `403` account disabled

---

### `POST /auth/logout`
Clear authentication cookie.

**Response 200:** `{ "message": "Logged out" }`

---

### `GET /auth/me`
Get current authenticated user.

**Response 200:**
```json
{ "id": "...", "username": "...", "display_name": "...", "role": "user", "created_at": "..." }
```

---

## Songs Endpoints

### `GET /songs?page=1&limit=20&sort=created_at`
List songs (paginated).

### `POST /songs`
Upload new song. Multipart form data:
- `file`: MP3 file (required)
- `cover`: Image file (optional)
- `title`: string (required)
- `artist`: string (required)
- `album`: string (optional)
- `genre`: string (optional)

### `GET /songs/{id}`
Get song metadata.

### `GET /songs/{id}/stream`
Get presigned streaming URL.

**Response:** `{ "stream_url": "https://...", "expires_in": 3600 }`

### `PUT /songs/{id}`
Update song metadata (owner or admin only).

### `DELETE /songs/{id}`
Delete song + R2 objects + cleanup (owner or admin only).

---

## Search

### `GET /search?q=query&limit=20`
Search songs by title, artist, album, genre.

---

## Playlists Endpoints

### `GET /playlists`
Get current user's playlists.

### `POST /playlists`
Create playlist.
```json
{ "name": "My Playlist", "description": "...", "is_public": false }
```

### `GET /playlists/{id}`
Get playlist with songs.

### `PUT /playlists/{id}`
Update playlist name/description.

### `DELETE /playlists/{id}`
Delete playlist.

### `POST /playlists/{id}/songs`
Add song to playlist.
```json
{ "song_id": "..." }
```

### `DELETE /playlists/{id}/songs/{song_id}`
Remove song from playlist.

### `PUT /playlists/{id}/songs/reorder`
Reorder songs in playlist.
```json
{ "song_ids": ["id1", "id2", "id3"] }
```

---

## Likes Endpoints

### `GET /likes`
Get current user's liked songs.

### `POST /likes/{song_id}`
Like a song.

### `DELETE /likes/{song_id}`
Unlike a song.

### `GET /likes/{song_id}/status`
Check if current user has liked a song.

---

## History Endpoints

### `GET /history?limit=50`
Get listening history (most recent first).

### `POST /history`
Record a play event.
```json
{ "song_id": "...", "seconds_played": 180, "completed": true }
```

### `GET /history/recently-played?limit=20`
Get recently played songs (deduplicated).

---

## Admin Endpoints

All require `role == admin`.

### `GET /admin/users?page=1&limit=20`
List all users.

### `POST /admin/users`
Create new user.
```json
{ "username": "email@example.com", "password": "...", "display_name": "...", "role": "user" }
```

### `GET /admin/users/{id}`
Get user details.

### `PUT /admin/users/{id}`
Update user (disable, change role, etc.).
```json
{ "is_active": false, "display_name": "..." }
```

### `DELETE /admin/users/{id}`
Delete user and their data.

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not logged in or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (e.g., duplicate username) |
| 413 | Payload Too Large (file too big) |
| 422 | Unprocessable Entity (Pydantic validation) |
| 500 | Internal Server Error |
