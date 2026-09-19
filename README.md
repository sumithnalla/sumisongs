# 🎵 Spotify Clone

A full-stack, production-ready Spotify-style music streaming web application.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + TypeScript 5 + Tailwind CSS 4 |
| Backend | Python 3.13 + FastAPI 0.115 + Motor (async MongoDB) |
| Database | MongoDB Atlas M0 |
| Storage | Cloudflare R2 (MP3s + cover art) |
| Frontend Host | Cloudflare Pages |
| Backend Host | Render.com |

## Features

- 🔐 Secure authentication (JWT + HTTP-only cookies)
- 🎵 Music upload, streaming (with seeking), playback
- ⏭️ Queue with Next / Previous / Shuffle / Repeat
- ❤️ Like songs
- 📋 Create and manage playlists
- 📜 Listening history + Recently Played
- 🔍 Search by title, artist, album, genre
- 👑 Admin dashboard (create/disable/delete users)
- 📱 Responsive design (desktop + mobile)

## Quick Start — Development

### Prerequisites
- Node.js 24+ with pnpm
- Python 3.13+
- MongoDB Atlas account (or local MongoDB)
- Cloudflare account with R2 enabled

### 1. Clone and configure

```bash
git clone <repo-url>
cd spotify-clone
```

### 2. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
cp ../.env.example .env
# Edit .env with your MongoDB URI, JWT secret, R2 credentials
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
pnpm install
echo "VITE_API_URL=http://localhost:8000" > .env.local
pnpm dev
# Opens at http://localhost:5173
```

### 4. Initialize Database

```bash
cd scripts
pip install -r requirements.txt
# Set MONGODB_URI in environment or .env
python init_db.py
```

## Default Accounts

After running `scripts/init_db.py`:

| Role | Username |
|------|---------|
| User | sumithnalla0607@gmail.com |
| Admin | sumithofficial2@gmail.com |

Passwords are set via environment variables during initialization (see `scripts/init_db.py`).

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and data flows |
| [DATABASE.md](docs/DATABASE.md) | Database schema and relationships |
| [API.md](docs/API.md) | REST API reference |
| [AUTHENTICATION.md](docs/AUTHENTICATION.md) | Auth flow and security |
| [SECURITY.md](docs/SECURITY.md) | Security measures |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment procedure |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment and dependency versions |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues and solutions |

## Production Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full instructions.

**Frontend:** `cd frontend && pnpm build && npx wrangler pages deploy dist --project-name spotify-clone`

**Backend:** Auto-deployed to Render.com on push to `main`

## Testing

```bash
cd backend
.venv\Scripts\activate
pytest tests/ -v
```

## License

Private project. All rights reserved.
