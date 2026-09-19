# Spotify-Style Music Streaming App — Implementation Plan

## Overview

Build a full-stack, production-ready Spotify-style music streaming application in **4 phases**, each tested before proceeding to the next. The application will be deployed on Cloudflare Pages (frontend) + a managed Python backend on **Cloudflare Workers** (via Python Workers support) or a dedicated PaaS host.

---

## Environment Audit Results

| Tool | Version | Status |
|------|---------|--------|
| Node.js | 24.21.0 | ✅ |
| npm | 11.19.0 | ✅ |
| pnpm | 12.4.2 | ✅ |
| Python | 3.13.7 | ✅ |
| pip | 25.2 | ✅ |
| Git | 2.50.0 | ✅ |
| Wrangler (via npx) | 4.135.0 | ✅ |
| Atlas CLI | 1.58.3 | ✅ |
| Cloudflare Auth | sumithnalla0607@gmail.com | ✅ |
| MongoDB Atlas Auth | sumithnalla0607@gmail.com | ✅ |
| Existing CF Account ID | 872fff74d9adfedf4fd7e5d0a62a8778 | ✅ |
| Existing Atlas Project | Project 0 (68306879f90e344aa985d26e) | ✅ (reuse) |

---

## User Review Required

> [!IMPORTANT]
> **R2 must be enabled on your Cloudflare account dashboard before the backend can use it for audio/image storage.**
> Navigate to **dash.cloudflare.com → R2 Object Storage → Enable** (first-time free-tier activation requires clicking a button in the UI). This is a one-click billing confirmation Cloudflare requires manually.
> Please do this now and confirm when done so the R2 bucket can be created via CLI.

> [!WARNING]
> **Backend hosting decision:** Cloudflare Workers does NOT support Python/FastAPI natively in a way compatible with async MongoDB drivers and full streaming. We will deploy the FastAPI backend to **Render.com** (free tier, zero-cost hobby plan) as a Docker-based web service. This is the standard production pattern for FastAPI + MongoDB + Cloudflare Pages. The frontend will be on Cloudflare Pages, the backend on Render.
> If you prefer a different host (Railway, Fly.io, etc.), let me know — otherwise Render will be used automatically.

> [!IMPORTANT]
> **Existing Atlas cluster:** There is already one cluster (`BookingProject`) in your Atlas project. A **new free-tier (M0) cluster** named `SpotifyClone` will be created in the same project. If you'd prefer to reuse the existing cluster with a separate database, please indicate that. M0 free clusters are limited to 1 per project; we may need to create a new project or reuse the cluster.

---

## Open Questions

> [!IMPORTANT]
> **Atlas M0 Free Tier Limit:** MongoDB Atlas allows only **one free M0 cluster per project**. Options:
> 1. Create a new Atlas Project specifically for this app and create an M0 cluster there (recommended — clean separation).
> 2. Create a new database inside the existing `BookingProject` cluster.
> Please confirm preference — I'll default to **option 2** (reuse existing cluster, new database `spotify_clone`) unless you say otherwise.

---

## Architecture Decision

```
┌──────────────────────────────────────────────────────────────┐
│                     PRODUCTION ARCHITECTURE                   │
├─────────────────┬──────────────────────┬─────────────────────┤
│   FRONTEND      │     BACKEND          │   DATA / STORAGE    │
│ Cloudflare Pages│  Render.com          │  MongoDB Atlas M0   │
│ React + Vite    │  Python FastAPI      │  (existing cluster) │
│ TypeScript      │  Uvicorn/Gunicorn    │                     │
│ Tailwind CSS    │                      │  Cloudflare R2      │
│                 │                      │  MP3s + Cover art   │
└─────────────────┴──────────────────────┴─────────────────────┘
         HTTPS          HTTPS (CORS)           AWS S3-compat
   Browser → CF Pages → FastAPI → MongoDB Atlas
                              ↓
                         Cloudflare R2 (audio/image storage)
                         Signed URL streaming to browser
```

**Auth flow:** JWT in HTTP-only cookies. Frontend on CF Pages calls the Render backend. CORS is configured to allow CF Pages domain only.

**Audio streaming:** Backend generates short-lived presigned R2 URLs (via boto3/S3-compat API). Browser streams audio directly from R2 using these URLs. Range requests fully supported.

---

## Phase 1 — Environment & Architecture Setup

**Goal:** Establish all infrastructure, create project skeleton, configure services, write docs. No application features yet.

### Infrastructure Tasks
1. Initialize Git repo + `.gitignore`
2. Create project folder structure:
   ```
   d:\spotify clone\
   ├── frontend/    (Vite React TS app)
   ├── backend/     (FastAPI Python app)
   ├── docs/        (ARCHITECTURE.md, etc.)
   ├── scripts/     (init-db.py, seed.py)
   ├── .gitignore
   ├── README.md
   └── .env.example
   ```
3. Create `docs/ARCHITECTURE.md`
4. Create `docs/ENVIRONMENT.md`
5. Create R2 bucket: `spotify-clone-media` (after user enables R2)
6. Create MongoDB database `spotify_clone` in existing Atlas cluster
7. Create all 6 collections with indexes via Atlas CLI + Python script
8. Create initial admin + user accounts (bcrypt-hashed, via Python script)
9. Generate `.env.example`

### Files Created in Phase 1
#### [NEW] `docs/ARCHITECTURE.md`
#### [NEW] `docs/ENVIRONMENT.md`
#### [NEW] `docs/DATABASE.md`
#### [NEW] `.gitignore`
#### [NEW] `.env.example`
#### [NEW] `README.md`
#### [NEW] `scripts/init_db.py` — creates collections, indexes, seed accounts

### Verification
- `atlas clusters describe` shows cluster is available
- R2 bucket creation succeeds
- `scripts/init_db.py` runs successfully, collections/indexes/accounts created
- MongoDB connection string tested

---

## Phase 2 — Backend (FastAPI)

**Goal:** Complete, tested FastAPI backend with all endpoints, authentication, authorization, R2 integration, and MongoDB operations.

### Structure
```
backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── auth/
│   │   ├── jwt.py
│   │   ├── dependencies.py
│   │   └── password.py
│   ├── models/
│   │   ├── user.py
│   │   ├── song.py
│   │   ├── playlist.py
│   │   ├── like.py
│   │   └── history.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── admin.py
│   │   ├── songs.py
│   │   ├── playlists.py
│   │   ├── likes.py
│   │   └── history.py
│   ├── services/
│   │   ├── r2.py
│   │   ├── audio.py
│   │   └── search.py
│   └── middleware/
│       └── cors.py
├── tests/
│   ├── test_auth.py
│   ├── test_songs.py
│   ├── test_playlists.py
│   └── test_admin.py
├── requirements.txt
├── Dockerfile
├── render.yaml
└── .env.example
```

### Key Endpoints
```
POST /auth/login          → JWT in HTTP-only cookie
POST /auth/logout         → clear cookie
GET  /auth/me             → current user info

GET  /songs               → paginated song list
POST /songs               → upload song (multipart/form-data)
GET  /songs/{id}          → song metadata
GET  /songs/{id}/stream   → presigned R2 URL for streaming
DELETE /songs/{id}        → delete song + R2 + cleanup

GET  /playlists           → user's playlists
POST /playlists           → create playlist
GET  /playlists/{id}      → playlist + songs
PUT  /playlists/{id}      → rename/update
DELETE /playlists/{id}    → delete
POST /playlists/{id}/songs → add song
DELETE /playlists/{id}/songs/{song_id} → remove song

POST /likes/{song_id}     → like song
DELETE /likes/{song_id}   → unlike song
GET  /likes               → liked songs list

GET  /history             → listening history
POST /history             → record play event

GET  /search?q=...        → search songs

GET  /admin/users         → list users (admin only)
POST /admin/users         → create user (admin only)
PUT  /admin/users/{id}    → update/disable user (admin only)
DELETE /admin/users/{id}  → delete user (admin only)
```

### Verification
- `pytest tests/` passes all test suites
- Backend starts and connects to MongoDB Atlas
- Auth endpoints return correct HTTP-only cookies
- Admin endpoints correctly enforce 403 for non-admins
- Song upload stores in R2 and creates MongoDB metadata
- Presigned URLs stream audio correctly

---

## Phase 3 — Frontend (React + Vite + TypeScript + Tailwind)

**Goal:** Complete, polished React frontend with all user features, global persistent music player, admin dashboard.

### Structure
```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   │   ├── client.ts       (axios instance)
│   │   ├── auth.ts
│   │   ├── songs.ts
│   │   ├── playlists.ts
│   │   ├── likes.ts
│   │   └── history.ts
│   ├── contexts/
│   │   ├── AuthContext.tsx
│   │   └── PlayerContext.tsx
│   ├── components/
│   │   ├── player/
│   │   │   ├── GlobalPlayer.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── VolumeControl.tsx
│   │   │   └── QueuePanel.tsx
│   │   ├── sidebar/
│   │   │   └── Sidebar.tsx
│   │   ├── songs/
│   │   │   ├── SongCard.tsx
│   │   │   ├── SongList.tsx
│   │   │   └── SongUploadModal.tsx
│   │   ├── playlists/
│   │   │   ├── PlaylistCard.tsx
│   │   │   └── PlaylistModal.tsx
│   │   └── ui/
│   │       ├── Toast.tsx
│   │       ├── Modal.tsx
│   │       ├── Button.tsx
│   │       └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── Library.tsx
│   │   ├── LikedSongs.tsx
│   │   ├── History.tsx
│   │   ├── PlaylistDetail.tsx
│   │   ├── Upload.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       └── UserManagement.tsx
│   ├── layouts/
│   │   ├── AppLayout.tsx
│   │   └── AuthLayout.tsx
│   ├── hooks/
│   │   ├── usePlayer.ts
│   │   ├── useAuth.ts
│   │   └── useToast.ts
│   └── types/
│       └── index.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### UI Highlights
- Dark music-focused interface (Spotify-inspired, original design)
- Persistent bottom music player (always visible)
- Sidebar navigation
- Song cards with cover art
- Full playback controls: play/pause, prev/next, shuffle, repeat (off/all/one)
- Queue panel
- Progress bar with seek
- Volume slider with mute
- Smooth Tailwind transitions and hover effects
- Toast notification system
- Admin dashboard (user creation, disable, delete)
- Responsive: desktop-first, mobile-adaptive

### Verification
- `pnpm build` succeeds with no TypeScript errors
- Routing works (React Router)
- Auth persists across page refreshes
- Music player maintains state during navigation
- Search returns results

---

## Phase 4 — Deployment, Testing & Smoke Tests

**Goal:** Deploy frontend to Cloudflare Pages, backend to Render, configure env vars, run production smoke tests, complete documentation.

### Tasks
1. Deploy backend to Render (Docker-based web service)
2. Deploy frontend to Cloudflare Pages (`npx wrangler pages deploy`)
3. Configure production environment variables on both platforms
4. Configure CORS on backend to allow CF Pages domain
5. Configure Cloudflare R2 CORS for audio streaming
6. Run production smoke test sequence (login → browse → play → playlist → like → history → logout)
7. Run admin smoke test (admin login → create user → disable → delete)
8. Update all docs to reflect actual deployed URLs

### Files Modified in Phase 4
#### [MODIFY] `docs/DEPLOYMENT.md`
#### [MODIFY] `docs/ARCHITECTURE.md` (add production URLs)

### Verification Plan
- CF Pages URL resolves and loads app
- Render backend API health endpoint responds
- Full auth flow works in production
- Audio streams correctly from R2
- Admin operations work
- All automated backend tests pass in CI

---

## Dependency Versions (Pre-selected)

### Frontend
| Package | Version |
|---------|---------|
| React | 19.x |
| Vite | 6.x |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| React Router | 7.x |
| Axios | 1.x |
| Zustand | 5.x (player/global state) |

### Backend
| Package | Version |
|---------|---------|
| FastAPI | 0.115.x |
| Pydantic | 2.x |
| Motor (async MongoDB) | 3.x |
| python-jose (JWT) | 3.x |
| bcrypt | 4.x |
| boto3 (R2/S3-compat) | 1.x |
| python-multipart | 0.0.x |
| uvicorn | 0.30.x |
| pytest / httpx | latest |

---

## Security Summary
- JWT stored in HTTP-only `Secure; SameSite=Lax` cookies only
- bcrypt password hashing (cost factor 12)
- All admin endpoints independently verify `role == admin` server-side
- R2 credentials never leave server
- MongoDB credentials never leave server
- CORS restricted to CF Pages origin in production
- No secrets in `.env` committed to Git
