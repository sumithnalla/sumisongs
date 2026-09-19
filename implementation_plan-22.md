# GridFS Storage Migration Plan

## Background

Currently songs are stored via **local filesystem fallback** (R2 is unconfigured). This works locally but won't survive a Render deployment (ephemeral disk). The goal is to switch the **active provider to MongoDB GridFS** — which is already connected — while keeping R2 (future) and local files (dev fallback) fully intact.

## Storage Architecture After Change

```
Storage Abstraction (BaseStorageProvider)
              │
   ┌──────────┼──────────┐
   ↓          ↓          ↓
GridFS        R2      Local Files
ACTIVE      FUTURE     FALLBACK
```

Controlled by: `STORAGE_PROVIDER=gridfs` in `.env`

---

## Open Questions / Decisions

> [!IMPORTANT]
> **Sample songs re-seed:** The 12 existing songs in the DB have `local_path` pointing to `songs/song (1).mp3` etc. on your disk. When GridFS becomes active, a new **migration script** will upload those files into GridFS and update the DB documents. The files themselves stay on disk (not deleted). Do you confirm this approach?

> [!NOTE]
> **MongoDB Atlas free tier (M0):** Has a 512 MB storage limit. Current library is ~49.6 MB (songs only). GridFS chunks have ~10–15% overhead, so ~55–60 MB total. You have ~450 MB headroom — safe for ~300 MB library. A health check endpoint will warn at 80% usage.

---

## Proposed Changes

### New Files

#### [NEW] `backend/app/services/storage/__init__.py`
Storage abstraction package init. Exports `get_storage_provider()`.

#### [NEW] `backend/app/services/storage/base.py`
Abstract base class `BaseStorageProvider` with these async methods:
- `upload_audio(file_bytes, key, content_type) -> str` (returns storage_ref)
- `upload_cover(file_bytes, key, content_type) -> str`
- `stream_audio(storage_ref, range_header) -> StreamingResponse`
- `get_cover_bytes(storage_ref) -> tuple[bytes, str]`
- `delete_audio(storage_ref) -> bool`
- `delete_cover(storage_ref) -> bool`
- `exists(storage_ref) -> bool`

#### [NEW] `backend/app/services/storage/gridfs_provider.py`
`GridFSProvider(BaseStorageProvider)` — uses `motor_asyncio` + `AsyncIOMotorGridFSBucket`.
- Stores files in two buckets: `audio_files` and `cover_images`
- Returns `storage_ref = "gridfs:<ObjectId>"` (provider-neutral string)
- Implements proper **HTTP Range streaming** via `AsyncIOMotorGridOut`
- Chunk-reads from GridFS into `StreamingResponse` — never loads full file into memory

#### [NEW] `backend/app/services/storage/r2_provider.py`
`R2Provider(BaseStorageProvider)` — wraps existing `services/r2.py` into the abstraction interface. Existing r2.py is **unchanged**.

#### [NEW] `backend/app/services/storage/local_provider.py`
`LocalProvider(BaseStorageProvider)` — wraps existing local file logic from songs.py into the abstraction. Existing behavior **unchanged**.

#### [NEW] `scripts/migrate_songs_to_gridfs.py`
One-time migration script:
- Reads all songs in MongoDB with `local_path` set
- Uploads each MP3 to GridFS
- Updates `song.storage_ref = "gridfs:<id>"` and `song.cover_storage_ref`
- Does NOT delete local files

#### [NEW] `backend/tests/test_gridfs_storage.py`
Tests for: GridFS upload, retrieve, delete, HTTP Range requests, provider selection, R2 importable, local fallback intact.

---

### Modified Files

#### [MODIFY] [`config.py`](file:///d:/spotify%20clone/backend/app/config.py)
Add:
```python
storage_provider: str = "gridfs"  # "gridfs" | "r2" | "local"
```

#### [MODIFY] [`database.py`](file:///d:/spotify%20clone/backend/app/database.py)
Add GridFS bucket initialization in `connect_to_mongo()`:
```python
from motor.motor_asyncio import AsyncIOMotorGridFSBucket
_audio_bucket: AsyncIOMotorGridFSBucket | None = None
_cover_bucket: AsyncIOMotorGridFSBucket | None = None

def get_audio_bucket() -> AsyncIOMotorGridFSBucket: ...
def get_cover_bucket() -> AsyncIOMotorGridFSBucket: ...
```

#### [MODIFY] [`routes/songs.py`](file:///d:/spotify%20clone/backend/app/routes/songs.py)
Replace direct r2_svc calls with `get_storage_provider()`. Key changes:
- `upload_song` → calls `provider.upload_audio()` + `provider.upload_cover()`
- `stream_audio_file` → calls `provider.stream_audio()` with Range header support
- `get_cover_image_file` → calls `provider.get_cover_bytes()`
- `delete_song` → calls `provider.delete_audio()` + `provider.delete_cover()`
- Song doc gets new fields: `storage_ref` (for audio) + `cover_storage_ref` (for cover)

#### [MODIFY] [`models/song.py`](file:///d:/spotify%20clone/backend/app/models/song.py)
Add optional fields:
```python
storage_ref: Optional[str] = None    # "gridfs:<id>" | "r2:<key>" | "local:<path>"
cover_storage_ref: Optional[str] = None
```

#### [MODIFY] [`services/r2.py`](file:///d:/spotify%20clone/backend/app/services/r2.py)
**No deletions.** File stays intact. It's wrapped by `R2Provider`.

#### [MODIFY] `backend/.env` + `backend/.env.example`
Add: `STORAGE_PROVIDER=gridfs`

#### [MODIFY] `docs/ARCHITECTURE.md` + `docs/DATABASE.md` + `docs/ENVIRONMENT.md`
Update to document GridFS as active provider, R2 as future, local as fallback, and how to switch.

---

## How Streaming Works

GridFS uses a `StreamingResponse` with an async generator:

```python
async def stream_gridfs(grid_out, start, end, chunk_size=65536):
    await grid_out.seek(start)
    remaining = end - start + 1
    while remaining > 0:
        chunk = await grid_out.read(min(chunk_size, remaining))
        if not chunk:
            break
        remaining -= len(chunk)
        yield chunk
```

The `/songs/{id}/audio` endpoint reads the `Range` header (e.g. `bytes=0-65535`), opens GridFS, seeks to position, and streams chunks. Returns **206 Partial Content** for range requests, **200** for full file.

---

## How Provider Switching Works

```python
# services/storage/__init__.py
def get_storage_provider() -> BaseStorageProvider:
    provider = get_settings().storage_provider.lower()
    if provider == "gridfs":
        return GridFSProvider()
    elif provider == "r2":
        return R2Provider()
    elif provider == "local":
        return LocalProvider()
    raise ValueError(f"Unknown STORAGE_PROVIDER: {provider}")
```

To switch to R2 later: set `STORAGE_PROVIDER=r2` in `.env` and restart.

---

## How Existing 12 Songs Are Handled

1. They currently have `local_path = "d:/spotify clone/songs/song (1).mp3"` etc.
2. After migration script runs, they get `storage_ref = "gridfs:<ObjectId>"` 
3. The audio route checks `storage_ref` first — if it starts with `gridfs:` it streams from GridFS
4. `local_path` field is preserved (not deleted) — local provider still works as fallback
5. Physical `.mp3` files in `songs/` are NOT deleted

---

## Verification Plan

### Automated Tests
```bash
cd backend
.venv\Scripts\pytest tests/ -v
```
Expected: all existing 26 tests + new GridFS tests pass.

### Manual Flow (user confirms)
`login → home → play song (GridFS stream) → seek → next/prev → upload new song → play it → delete it → verify removed from GridFS`

---

## Files Summary

| File | Action |
|---|---|
| `services/storage/__init__.py` | NEW |
| `services/storage/base.py` | NEW |
| `services/storage/gridfs_provider.py` | NEW |
| `services/storage/r2_provider.py` | NEW |
| `services/storage/local_provider.py` | NEW |
| `scripts/migrate_songs_to_gridfs.py` | NEW |
| `tests/test_gridfs_storage.py` | NEW |
| `config.py` | MODIFY — add `storage_provider` |
| `database.py` | MODIFY — add GridFS buckets |
| `routes/songs.py` | MODIFY — use provider abstraction |
| `models/song.py` | MODIFY — add `storage_ref` fields |
| `services/r2.py` | **NO CHANGE** |
| `.env` / `.env.example` | MODIFY — add `STORAGE_PROVIDER=gridfs` |
| `docs/*.md` | MODIFY — update storage docs |
