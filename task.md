# Spotify Clone — Task Tracker

## Phase 1 — Environment & Architecture Setup
- [/] Initialize Git repository + `.gitignore`
- [ ] Create full project folder structure
- [ ] Create `docs/ARCHITECTURE.md`
- [ ] Create `docs/ENVIRONMENT.md`
- [ ] Create `docs/DATABASE.md`
- [ ] Create `docs/AUTHENTICATION.md`
- [ ] Create `docs/SECURITY.md`
- [ ] Create `docs/DEPLOYMENT.md`
- [ ] Create `docs/API.md`
- [ ] Create `docs/TROUBLESHOOTING.md`
- [ ] Create `.env.example`
- [ ] Create `README.md`
- [ ] Create `scripts/init_db.py` (collections + indexes + seed accounts)
- [ ] Run `scripts/init_db.py` — verify MongoDB setup
- [ ] Create Cloudflare R2 bucket `spotify-clone-media`
- [ ] Verify R2 bucket accessible

## Phase 2 — FastAPI Backend
- [ ] Initialize Python virtual environment
- [ ] Install backend dependencies
- [ ] Create backend project structure
- [ ] Implement `config.py` (env vars, settings)
- [ ] Implement `database.py` (Motor async MongoDB)
- [ ] Implement `auth/password.py` (bcrypt)
- [ ] Implement `auth/jwt.py` (JWT creation/verification)
- [ ] Implement `auth/dependencies.py` (FastAPI deps)
- [ ] Implement `models/` (Pydantic schemas)
- [ ] Implement `routes/auth.py` (login, logout, me)
- [ ] Implement `routes/songs.py` (CRUD + stream)
- [ ] Implement `routes/playlists.py` (CRUD + songs)
- [ ] Implement `routes/likes.py`
- [ ] Implement `routes/history.py`
- [ ] Implement `routes/search.py`
- [ ] Implement `routes/admin.py` (user management)
- [ ] Implement `services/r2.py` (upload, delete, presigned URLs)
- [ ] Implement `services/audio.py` (metadata extraction)
- [ ] Implement CORS middleware
- [ ] Write `tests/test_auth.py`
- [ ] Write `tests/test_songs.py`
- [ ] Write `tests/test_playlists.py`
- [ ] Write `tests/test_admin.py`
- [ ] Run all backend tests — pass
- [ ] Create `Dockerfile` for Render
- [ ] Create `render.yaml`
- [ ] Backend builds successfully

## Phase 3 — React Frontend
- [ ] Scaffold Vite + React + TypeScript project
- [ ] Install frontend dependencies (Tailwind, React Router, Axios, Zustand)
- [ ] Configure Tailwind CSS v4
- [ ] Create `types/index.ts`
- [ ] Implement `api/client.ts` (Axios + cookie credentials)
- [ ] Implement `api/auth.ts`, `api/songs.ts`, `api/playlists.ts`, `api/likes.ts`, `api/history.ts`
- [ ] Implement `contexts/AuthContext.tsx`
- [ ] Implement `contexts/PlayerContext.tsx` (queue, shuffle, repeat)
- [ ] Implement layouts: `AppLayout.tsx`, `AuthLayout.tsx`
- [ ] Implement UI components (Button, Modal, Toast, Spinner)
- [ ] Implement Sidebar
- [ ] Implement `GlobalPlayer.tsx` (persistent bottom bar)
- [ ] Implement ProgressBar + seeking
- [ ] Implement VolumeControl + mute
- [ ] Implement QueuePanel
- [ ] Implement SongCard + SongList
- [ ] Implement pages: Login, Home, Search, Library, LikedSongs, History
- [ ] Implement PlaylistDetail page
- [ ] Implement Upload page
- [ ] Implement admin pages: AdminDashboard, UserManagement
- [ ] `pnpm build` — zero TypeScript errors
- [ ] All routing works
- [ ] Auth persists across refresh
- [ ] Player persists during navigation

## Phase 4 — Deployment + Smoke Tests
- [ ] Deploy backend to Render.com
- [ ] Configure Render environment variables
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Configure CF Pages environment variables
- [ ] Configure R2 CORS for audio streaming
- [ ] Configure backend CORS for CF Pages domain
- [ ] User smoke test: login → browse → play → playlist → like → history → logout
- [ ] Admin smoke test: login → create user → disable → delete → verify
- [ ] All final docs updated with production URLs
- [ ] Final acceptance criteria checklist verified
