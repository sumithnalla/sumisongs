# Spotify Clone — Database

## Overview

Database: **MongoDB Atlas**
Database Name: `spotify_clone`
Cluster: Shared M0 (existing Atlas cluster)
Driver: Motor 3.x (async Python)

---

## Collections

### 1. `users`

Stores all application users (both regular users and administrators).

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `username` | String | ✅ | Email address used for login |
| `password_hash` | String | ✅ | bcrypt hash — NEVER plaintext |
| `display_name` | String | ✅ | Display name shown in UI |
| `role` | String | ✅ | `"user"` or `"admin"` |
| `is_active` | Boolean | ✅ | `false` = disabled, cannot login |
| `created_at` | DateTime | ✅ | Account creation timestamp |
| `updated_at` | DateTime | ✅ | Last update timestamp |
| `last_login` | DateTime | ❌ | Last successful login |

**Indexes:**
- `username` — unique index (prevents duplicate accounts)
- `role` — for admin queries
- `is_active` — for filtering active/inactive users

---

### 2. `songs`

Stores song metadata. The actual MP3 binary lives in Cloudflare R2.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `title` | String | ✅ | Song title |
| `artist` | String | ✅ | Artist name |
| `album` | String | ❌ | Album name |
| `genre` | String | ❌ | Genre |
| `duration` | Float | ✅ | Duration in seconds |
| `audio_file_key` | String | ✅ | R2 object key e.g. `songs/<id>.mp3` |
| `cover_image_key` | String | ❌ | R2 object key e.g. `covers/<id>.jpg` |
| `uploaded_by` | ObjectId | ✅ | Reference to users._id |
| `created_at` | DateTime | ✅ | Upload timestamp |
| `updated_at` | DateTime | ✅ | Last update timestamp |
| `play_count` | Integer | ✅ | Total plays (default: 0) |
| `is_public` | Boolean | ✅ | Publicly visible (default: true) |

**Indexes:**
- `title` text + `artist` text + `album` text + `genre` text — full-text search index
- `uploaded_by` — for user's songs queries
- `created_at` — for ordering/pagination
- `play_count` — for trending/popular queries

---

### 3. `playlists`

Stores user-created playlists.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `name` | String | ✅ | Playlist name |
| `description` | String | ❌ | Optional description |
| `owner_id` | ObjectId | ✅ | Reference to users._id |
| `cover_image_key` | String | ❌ | R2 object key for cover |
| `is_public` | Boolean | ✅ | Default: false |
| `created_at` | DateTime | ✅ | Creation timestamp |
| `updated_at` | DateTime | ✅ | Last update timestamp |

**Indexes:**
- `owner_id` — for fetching user's playlists

---

### 4. `playlist_songs`

Junction table linking playlists to songs with ordering support.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `playlist_id` | ObjectId | ✅ | Reference to playlists._id |
| `song_id` | ObjectId | ✅ | Reference to songs._id |
| `position` | Integer | ✅ | Ordering within playlist (0-based) |
| `added_at` | DateTime | ✅ | When song was added |

**Indexes:**
- Compound `{ playlist_id: 1, position: 1 }` — for ordered song retrieval
- Compound `{ playlist_id: 1, song_id: 1 }` — unique, prevents duplicate songs

---

### 5. `likes`

Tracks which songs each user has liked.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `user_id` | ObjectId | ✅ | Reference to users._id |
| `song_id` | ObjectId | ✅ | Reference to songs._id |
| `created_at` | DateTime | ✅ | When song was liked |

**Indexes:**
- Compound `{ user_id: 1, song_id: 1 }` — **unique** (prevents duplicate likes)
- `user_id` — for fetching user's liked songs
- `song_id` — for checking if song is liked / like count

---

### 6. `listening_history`

Records user listening activity. Used for Recently Played, History, and future recommendations.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | auto | Primary key |
| `user_id` | ObjectId | ✅ | Reference to users._id |
| `song_id` | ObjectId | ✅ | Reference to songs._id (nullable if deleted) |
| `played_at` | DateTime | ✅ | When playback started |
| `seconds_played` | Float | ✅ | Seconds actually listened |
| `completed` | Boolean | ✅ | Whether song was played to completion |

**Indexes:**
- Compound `{ user_id: 1, played_at: -1 }` — for "recently played" queries
- `song_id` — for song play count aggregation

**Performance notes:**
- History is written once per song play (at end or meaningful threshold)
- NOT written every second during playback

---

## Relationships

```
users ──────────────── owns ──────────────── playlists
  │                                              │
  │ uploads                           playlist_songs
  │                                              │
  └──────────── songs ──────────────────────────┘
                  │
                  ├──── likes ────────── users
                  │
                  └──── listening_history ── users
```

---

## Deletion Behavior

| Entity Deleted | Cascading Effect |
|---------------|-----------------|
| User | Delete their playlists, playlist_songs, likes, history |
| Song | Delete from R2 (audio + cover), delete playlist_songs, delete likes, **retain** history (song_id set to null) |
| Playlist | Delete playlist_songs for that playlist only |
| Like | No cascade |

---

## R2 Key Format

Audio files and cover images are stored in Cloudflare R2 with predictable keys:

```
songs/<song_id>.mp3        # audio file
covers/<song_id>.jpg       # cover image (if uploaded)
```

The MongoDB `songs` document stores these keys. The backend resolves them to presigned URLs on demand.

---

## Initial Seed Accounts

Created via `scripts/init_db.py` with bcrypt-hashed passwords:

| Username | Role | Active |
|---------|------|--------|
| sumithnalla0607@gmail.com | user | true |
| sumithofficial2@gmail.com | admin | true |

Plaintext passwords are only used during the init script execution and never stored.
