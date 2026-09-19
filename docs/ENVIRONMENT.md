# Spotify Clone — Environment

## Development Environment

### Runtime Versions

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 24.21.0 | LTS — used for frontend tooling |
| npm | 11.19.0 | Bundled with Node |
| pnpm | 12.4.2 | Primary package manager for frontend |
| Python | 3.13.7 | Backend runtime |
| pip | 25.2 | Python package manager |
| Git | 2.50.0 | Version control |
| Wrangler | 4.135.0 | Cloudflare deployment CLI (via npx) |
| Atlas CLI | 1.58.3 | MongoDB Atlas management CLI |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.x | UI framework |
| React DOM | 19.x | DOM renderer |
| Vite | 6.x | Build tool + dev server |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Utility-first CSS |
| React Router | 7.x | Client-side routing |
| Axios | 1.x | HTTP client |
| Zustand | 5.x | Global state management (player, queue) |
| @types/react | 19.x | TypeScript types |

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| FastAPI | 0.115.x | Python web framework |
| Pydantic | 2.x | Data validation and schemas |
| Motor | 3.x | Async MongoDB driver (wraps PyMongo) |
| PyMongo | 4.x | MongoDB driver (used by Motor) |
| python-jose[cryptography] | 3.x | JWT creation and verification |
| bcrypt | 4.x | Password hashing |
| passlib[bcrypt] | 1.x | Password hashing helper |
| boto3 | 1.x | AWS S3-compatible API (Cloudflare R2) |
| botocore | 1.x | boto3 dependency |
| python-multipart | 0.0.x | Multipart file upload support |
| mutagen | 1.x | Audio metadata extraction (duration) |
| uvicorn[standard] | 0.30.x | ASGI server |
| gunicorn | 22.x | Process manager (production) |
| python-dotenv | 1.x | .env file loading |
| httpx | 0.27.x | Async HTTP client (testing) |
| pytest | 8.x | Test framework |
| pytest-asyncio | 0.24.x | Async test support |

---

## Infrastructure

| Service | Provider | Tier |
|---------|----------|------|
| Frontend hosting | Cloudflare Pages | Free |
| Backend hosting | Render.com | Free Web Service |
| Database | MongoDB Atlas | M0 Free |
| Object storage | Cloudflare R2 | Free (10GB/month) |
| CDN | Cloudflare (built-in) | Free |

---

## Local Development Setup

### Prerequisites
1. Node.js 24+ (with pnpm installed globally)
2. Python 3.13+
3. Git

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/Mac
# Edit .env with your values
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
pnpm install
copy .env.example .env.local  # Windows
# cp .env.example .env.local  # Linux/Mac
# Set VITE_API_URL=http://localhost:8000
pnpm dev
```

### Database Initialization

```bash
cd scripts
pip install motor python-dotenv bcrypt pymongo
python init_db.py
```

---

## Production Build

### Frontend
```bash
cd frontend
pnpm build
# Output: frontend/dist/
```

### Backend
```bash
cd backend
docker build -t spotify-clone-backend .
```

---

## Deployment Credentials Location

- **Cloudflare:** `%APPDATA%\xdg.config\.wrangler\config\default.toml`
- **MongoDB Atlas CLI:** Configured via `atlas auth login`
- **Render:** Dashboard at https://dashboard.render.com
