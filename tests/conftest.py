"""Pytest fixtures for unit and integration tests.

Configures an isolated in-memory SQLite async engine and clean session per test.
"""

from collections.abc import AsyncGenerator
import pytest
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.database import Base, create_app_engine


@pytest.fixture
async def async_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide an isolated, transactional in-memory database session for testing."""
    test_engine = create_app_engine("sqlite+aiosqlite:///:memory:")
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    test_sessionmaker = async_sessionmaker(
        bind=test_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    async with test_sessionmaker() as session:
        yield session

    await test_engine.dispose()
