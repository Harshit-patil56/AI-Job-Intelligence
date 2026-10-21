"""Database connection, engine configuration, and session management.

Supports both PostgreSQL (production) and SQLite (fast local testing)
using SQLAlchemy 2.0 async engine and sessionmaker.
"""

import asyncio
from collections.abc import AsyncGenerator
from sqlalchemy import JSON, event
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.config.settings import settings

# Dialect-agnostic JSON type: uses JSONB on PostgreSQL, JSON on SQLite.
JSON_VARIANT = JSON().with_variant(JSONB, "postgresql")


class Base(DeclarativeBase):
    """Base declarative class for all SQLAlchemy 2.0 ORM models."""
    pass


def create_app_engine(url: str | None = None) -> AsyncEngine:
    """Create configured async SQLAlchemy engine."""
    db_url = url or settings.database_url
    engine_kwargs = {
        "echo": settings.db_echo_sql,
        "future": True,
    }

    # SQLite specific connection tuning
    if db_url.startswith("sqlite"):
        engine_kwargs["connect_args"] = {
            "check_same_thread": False,
            "timeout": 60.0,
        }

    engine = create_async_engine(db_url, **engine_kwargs)

    # Enable foreign keys and WAL mode for SQLite
    if db_url.startswith("sqlite"):
        @event.listens_for(engine.sync_engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            try:
                # Under aiosqlite, _connection._conn is the standard sqlite3.Connection
                sync_conn = getattr(getattr(dbapi_connection, "_connection", None), "_conn", None) or dbapi_connection
                if sync_conn and hasattr(sync_conn, "execute"):
                    sync_conn.execute("PRAGMA foreign_keys=ON")
                    sync_conn.execute("PRAGMA journal_mode=WAL")
                    sync_conn.execute("PRAGMA busy_timeout=60000")
                    sync_conn.execute("PRAGMA synchronous=NORMAL")
            except Exception:
                pass

    return engine


engine: AsyncEngine = create_app_engine()
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Dependency provider for async database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db(engine_to_use: AsyncEngine | None = None) -> None:
    """Initialize database tables in-process (useful for development and test harnesses)."""
    eng = engine_to_use or engine
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db(engine_to_use: AsyncEngine | None = None) -> None:
    """Dispose the engine connection pool cleanly."""
    eng = engine_to_use or engine
    await eng.dispose()
