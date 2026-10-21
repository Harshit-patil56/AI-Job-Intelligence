"""FastAPI Application Entry Point.

Builds FastAPI instance, registers middleware, mounts route handlers,
and configures lifespan database connection lifecycle.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import structlog

from app.api.routes.companies import router as companies_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.pipeline import router as pipeline_router
from app.api.routes.profile import router as profile_router
from app.config.settings import settings
from app.models.database import close_db, init_db
from app.scheduling.scheduler import AppScheduler

logger = structlog.get_logger()

_scheduler = AppScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager: sets up DB, starts scheduler, and tears down cleanly."""
    logger.info("Initializing database schema on startup")
    await init_db()
    _scheduler.start()
    yield
    _scheduler.shutdown()
    logger.info("Disposing database connections on shutdown")
    await close_db()


def create_app() -> FastAPI:
    """FastAPI application factory."""
    app = FastAPI(
        title=settings.app_name,
        description="High-precision AI Job Intelligence & Ingestion Platform",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS configuration for future Next.js frontend
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Health check route
    @app.get("/health", tags=["Health"])
    async def health_check():
        return {
            "status": "healthy",
            "environment": settings.app_env,
            "version": "0.1.0",
        }

    # Mount routers
    app.include_router(jobs_router)
    app.include_router(pipeline_router)
    app.include_router(companies_router)
    app.include_router(profile_router)

    return app


app = create_app()
