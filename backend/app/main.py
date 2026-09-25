"""
Spotify Clone — FastAPI Application Entry Point
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, songs, playlists, likes, history, search, admin

# ── Logging setup ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
log = logging.getLogger(__name__)


# ── Lifespan ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown event handlers."""
    settings = get_settings()
    log.info("Starting SumiSongs Backend (environment: %s)", settings.environment)
    await connect_to_mongo()
    yield
    log.info("Shutting down...")
    await close_mongo_connection()


# ── Application factory ────────────────────────────────────
def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="SumiSongs API",
        version="1.0.0",
        description="Music streaming API — FastAPI + MongoDB + Cloudflare R2",
        lifespan=lifespan,
        # Hide docs in production
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
    )

    # ── CORS ───────────────────────────────────────────────
    origins = settings.allowed_origins_list
    log.info("CORS allowed origins: %s", origins)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept", "Cookie"],
        expose_headers=["Set-Cookie"],
    )

    # ── Routes ─────────────────────────────────────────────
    app.include_router(auth.router)
    app.include_router(songs.router)
    app.include_router(playlists.router)
    app.include_router(likes.router)
    app.include_router(history.router)
    app.include_router(search.router)
    app.include_router(admin.router)

    # ── Health check ───────────────────────────────────────
    @app.get("/health")
    async def health_check():
        from app.database import get_database
        from app.services.r2 import check_r2_health
        try:
            db = get_database()
            await db.command("ping")
            db_status = "ok"
        except Exception as e:
            db_status = f"error: {e}"

        r2_status = check_r2_health()

        return {
            "status": "ok" if db_status == "ok" else "degraded",
            "database": db_status,
            "r2": r2_status,
            "environment": settings.environment,
        }

    @app.get("/")
    async def root():
        return {"message": "SumiSongs API", "version": "1.0.0", "docs": "/docs"}

    return app


app = create_app()
