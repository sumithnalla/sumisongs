# SumiSongs — Agent Guidelines & System Architecture (`AGENTS.md`)

> **CRITICAL FOR ALL AGENTS & NEW CHAT SESSIONS:**
> Read this file first before making any modifications to the codebase. It explains the entire architecture, wiring, hosting setup, authentication design, and strict rules to prevent regressions.

---

## 1. Project Overview & Identity
- **Name:** SumiSongs (formerly Spotify Clone)
- **Live Frontend:** [https://sumisongs.pages.dev](https://sumisongs.pages.dev)
- **Live Backend API:** [https://sumisongs-api.onrender.com](https://sumisongs-api.onrender.com)
- **GitHub Repository:** [https://github.com/sumithnalla/sumisongs](https://github.com/sumithnalla/sumisongs) (`main` branch)

---

## 2. System Architecture & Wiring

```
[Browser / Mobile Client]
       │
       ▼
[Cloudflare Pages Edge: sumisongs.pages.dev]
       │
       ├─ Static Assets & SPA Routes  ──> Served by Cloudflare Edge CDN (dist/)
       │
       └─ /api/* Requests  ───[_worker.js Edge Reverse Proxy]───►  [Render Web Service: sumisongs-api.onrender.com]
                                                                        │
                                                                        ▼
                                                             [FastAPI Python Backend]
                                                                        │
                                                                        ▼
                                                             [MongoDB Atlas + GridFS]
                                                             (Binary MP3 Chunks & Covers)
```

### Key Architectural Components:
1. **Frontend (`frontend/`)**:
   - Built with **React 19**, **TypeScript**, **Vite 8**, **Tailwind CSS v4**, **Lucide Icons**, and **Zustand / React Contexts**.
   - Client requests always target `/api/...` (e.g. `/api/auth/login`, `/api/songs`).
   - In local development (`vite.config.ts`), `/api` is proxied to `http://localhost:8000`.
   - In production, Cloudflare Pages `_worker.js` intercepts `/api/*` and proxies requests directly to `https://sumisongs-api.onrender.com` while preserving Range, Authorization, and Cookie headers.
   - Theme system: Dark & Light mode powered by CSS variables in `index.css` and `ThemeContext.tsx`.

2. **Backend (`backend/`)**:
   - Built with **FastAPI** + **Uvicorn** + **Motor** (Async MongoDB driver).
   - Audio files are stored directly in MongoDB Atlas using **GridFS** (`fs.files` & `fs.chunks`).
   - Audio streaming endpoint: `GET /api/songs/{id}/audio` supports HTTP 206 Partial Content (HTTP Range requests) for instant seeking, pause/resume, and scrubber scrubbing.
   - Dual Authentication:
     - `access_token` stored in HTTP-only Cookie.
     - `Authorization: Bearer <token>` attached automatically via `frontend/src/api/client.ts` from `localStorage`.
     - Backend `get_current_user` in `backend/app/auth/dependencies.py` checks both headers and cookies to guarantee 100% login reliability across all browsers and privacy modes.

3. **Storage Providers**:
   - Provider abstraction in `backend/app/services/storage/`. Default active provider is `gridfs` (storing audio in MongoDB Atlas GridFS). R2 and local providers exist as alternate implementations.

---

## 3. Strict Rules for All Agents / Chat Windows

To ensure seamless integration and avoid breaking functionality:

1. **DO NOT Alter the Edge Reverse Proxy Wiring**:
   - Never change the `/api` prefix in frontend calls.
   - Keep `frontend/public/_worker.js` intact; it handles edge proxying to Render and client-side SPA routing fallback.
2. **DO NOT Break Dual Authentication**:
   - Always keep both cookie handling (`withCredentials: true`) and Bearer token attachment in `frontend/src/api/client.ts`.
3. **DO NOT Delete Code or Database Schema Without Explicit User Permission**:
   - When asked to remove or hide a UI feature (e.g. "Recently Played"), comment out the JSX presentation layer. Keep the backend endpoints, data hooks, and DB schemas intact for future restoration.
4. **ALWAYS Verify Builds Before Finishing**:
   - Run `npm run build` in `frontend/` to confirm zero TypeScript compilation errors.
   - If modifying backend, run `.\.venv\Scripts\python -m pytest` in `backend/` to confirm all 40 tests pass.
5. **ALWAYS Commit, Push, and Deploy**:
   - **Frontend:** Must be deployed to Cloudflare Pages via:
     `npx wrangler pages deploy "dist" --project-name sumisongs --branch main --commit-dirty=true`
   - **Backend & Repo:** Must be staged, committed, and pushed to GitHub `origin main`. Pushing to `main` automatically triggers Render's rolling deployment.
6. **DOCUMENT All Changes**:
   - Update `run.md` with any new execution steps.
   - Summarize changes clearly to the user.

---

## 4. Quick Command Reference

### Local Development:
```powershell
# Backend (Port 8000)
cd "d:\spotify clone\backend"
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# Frontend (Port 5173)
cd "d:\spotify clone\frontend"
npm run dev
```

### Production Deployment:
```powershell
# 1. Deploy Frontend to Cloudflare Pages
cd "d:\spotify clone\frontend"
npm run build
npx wrangler pages deploy "dist" --project-name sumisongs --branch main --commit-dirty=true

# 2. Deploy Backend & Sync Repo (Triggers Render deploy)
cd "d:\spotify clone"
git add .
git commit -m "feat: description of changes"
git push origin main
```

---

## 5. Seed Credentials

- **Standard User:** `sumithnalla0607@gmail.com` / `SN06072006`
- **Admin User:** `sumithofficial2@gmail.com` / `SN06072006` (or `sumith0FF_1104`)
