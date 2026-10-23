"""Application Settings and Configuration Management.

Uses Pydantic Settings v2 for typed, environment-driven configuration.
"""

from pathlib import Path
from typing import Literal
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    """Central application settings."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # General
    app_env: Literal["development", "production", "testing"] = "development"
    app_name: str = "AI-Job-Intelligence"
    app_debug: bool = False
    log_level: str = "INFO"

    # Database
    # Defaults to local async SQLite file for friction-free dev/testing.
    # In production, use: postgresql+asyncpg://user:pass@host/db
    database_url: str = Field(
        default="sqlite+aiosqlite:///./ai_job_intelligence.db",
        description="Async SQLAlchemy database connection string",
    )
    db_echo_sql: bool = False

    # HTTP Collector Client Defaults
    collector_timeout_seconds: float = 15.0
    collector_max_retries: int = 3
    collector_user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/128.0.0.0 Safari/537.36"
    )

    # Scheduler Settings
    scheduler_enabled: bool = False
    collection_interval_hours: int = 6

    # LLM Gateway Settings (ADR-007, ADR-008, ADR-009)
    llm_enabled: bool = True
    llm_timeout_seconds: float = 20.0
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-2.5-flash"
    groq_api_key: str | None = None
    groq_model: str = "llama-3.1-8b-instant"
    openrouter_api_key: str | None = None
    openrouter_model: str = "deepseek/deepseek-chat:free"
    ollama_base_url: str | None = None
    ollama_model: str = "llama3.2:3b"


settings = Settings()
