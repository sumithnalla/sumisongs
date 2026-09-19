# Spotify Clone — Architecture

## System Overview

This document describes the production deployment architecture for the Spotify-style music streaming web application.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
└──────────────┬──────────────────────────────┬───────────────────┘
               │ HTTPS                        │ HTTPS (audio stream)
               ▼                              ▼
┌──────────────────────┐         ┌─────────────────────────────┐
│  Cloudflare Pages    │         │  Cloudflare R2               │
│  (Frontend)          │         │  spotify-clone-media bucket  │
│  React + Vite + TS   │         │  songs/<id>.mp3              │
│  Tailwind CSS        │         │  covers/<id>.jpg             │
│  React Router        │         │                              │
└──────────┬───────────┘         └─────────────────────────────┘
           │ API calls (HTTPS / JSON + cookies)         ▲
           ▼                                            │ Presigned URL
┌──────────────────────┐                               │
│  Render.com          │───────────────────────────────┘
│  (Backend)           │  S3-compatible boto3 API
│  Python FastAPI      │
│  Uvicorn / Gunicorn  │
│  JWT (HTTP-only 🍪)  │
└──────────┬───────────┘
           │ Motor (async pymongo)
           ▼
┌──────────────────────┐
│  MongoDB Atlas       │
│  Shared M0 Cluster   │
│  Database: spotify_clone │
│  6 Collections       │
└──────────────────────┘
```

---

## Component Details

### Frontend — Cloudflare Pages

- **Host:** Cloudflare Pages (CDN-distributed, zero-cost tier)
- **Build command:** `pnpm build`
- **Output directory:** `frontend/dist`
- **Framework:** React 19 + Vite 6 + TypeScript 5 + Tailwind CSS 4
- **Routing:** React Router 7 (client-side SPA routing)
- **State:** Zustand for global player state; React Context for auth
- **Deployment:** `npx wrangler pages deploy dist --project-name spotify-clone`

### Backend — Render.com

- **Host:** Render.com Web Service (Docker)
- **Runtime:** Python 3.13 + FastAPI 0.115 + Uvicorn
- **Port:** 8000 (internal), exposed via Render HTTPS URL
- **Auth:** JWT tokens stored in HTTP-only cookies
- **CORS:** Restricted to Cloudflare Pages domain in production

### Database — MongoDB Atlas

- **Provider:** MongoDB Atlas
- **Cluster:** Shared M0 (existing `BookingProject` cluster)
- **Database:** `spotify_clone`
- **Driver:** Motor 3.x (async Python driver)
- **Collections:** users, songs, playlists, playlist_songs, likes, listening_history

### Audio/Image Storage — Cloudflare R2

- **Provider:** Cloudflare R2 Object Storage
- **Bucket:** `spotify-clone-media`
- **Access:** S3-compatible API (boto3) from backend only
- **Audio path:** `songs/<song_id>.mp3`
- **Cover path:** `covers/<song_id>.jpg`
- **Streaming:** Backend generates short-lived presigned GET URLs → browser streams directly from R2

---

## Authentication Flow

```
1. User submits username + password to POST /auth/login
2. FastAPI: look up user in MongoDB by username
3. FastAPI: bcrypt.verify(plain_password, stored_hash)
4. If valid: create JWT (expiry: 7 days)
5. Set JWT as HTTP-only, Secure, SameSite=Lax cookie
6. Browser: cookie sent automatically on all subsequent requests
7. Each protected route: FastAPI dependency reads & validates JWT
8. JWT contains: user_id, username, role
```

---

## Audio Streaming Flow

```
1. Frontend: user clicks play on a song
2. Frontend: GET /songs/{id}/stream → backend validates auth
3. Backend: generates presigned R2 URL (valid 1 hour)
4. Backend: returns { stream_url: "https://r2.cloudflare.com/..." }
5. Frontend: sets <audio src> to the presigned URL
6. Browser: streams directly from R2 (HTTP Range requests supported)
7. User can seek, pause, resume — full browser native audio API
```

---

## Upload Flow

```
1. Frontend: user selects MP3 + cover image + metadata form
2. Frontend: POST /songs (multipart/form-data) with auth cookie
3. Backend: validates file type (magic bytes), size ≤ 50MB
4. Backend: extracts audio duration via mutagen
5. Backend: generates UUID for song_id
6. Backend: uploads MP3 to R2 as songs/<song_id>.mp3
7. Backend: uploads cover to R2 as covers/<song_id>.jpg
8. Backend: inserts song metadata document into MongoDB
9. Backend: returns created song metadata
10. Frontend: refreshes song list
```

---

## Song Deletion Flow

```
1. Authenticated + authorized user/admin calls DELETE /songs/{id}
2. Backend: verifies requester owns song OR is admin
3. Backend: delete R2 object songs/<song_id>.mp3
4. Backend: delete R2 object covers/<song_id>.jpg (if exists)
5. Backend: delete playlist_songs documents referencing song
6. Backend: delete likes documents referencing song
7. Backend: retain listening_history (anonymize song reference)
8. Backend: delete MongoDB songs document
```

---

## Deployment Flow

1. **Backend:** Push to GitHub → Render auto-deploys from Dockerfile
2. **Frontend:** `cd frontend && pnpm build && npx wrangler pages deploy dist --project-name spotify-clone`
3. **Environment Variables:** Set via Render dashboard (backend) and CF Pages dashboard (frontend)

---

## Environment Variables

### Backend (Render)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `MONGODB_DATABASE` | `spotify_clone` |
| `JWT_SECRET` | Random 64-char hex string |
| `JWT_EXPIRE_DAYS` | `7` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` | R2 API token key |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret |
| `R2_BUCKET_NAME` | `spotify-clone-media` |
| `R2_PUBLIC_URL` | Public R2 bucket URL |
| `ALLOWED_ORIGINS` | Cloudflare Pages URL |
| `ENVIRONMENT` | `production` |

### Frontend (Cloudflare Pages)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Render backend URL |

---

## Security Boundaries

- MongoDB credentials: **server-side only** (never in frontend)
- R2 credentials: **server-side only** (never in frontend)
- JWT: **HTTP-only cookie** (not accessible to JavaScript)
- Admin role: **verified server-side on every admin request**
- CORS: **whitelist only CF Pages origin** in production
- Passwords: **bcrypt hashed** (never stored or returned in plaintext)
- R2 audio: **presigned URLs** expire in 1 hour (no permanent public access)
