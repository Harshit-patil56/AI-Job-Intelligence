"""Deterministic result caching layer implementing ADR-009 via composite SHA256 hashing."""

import hashlib
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.entities import AIAnalysisResult

logger = structlog.get_logger()


def calculate_input_hash(content: str, prompt_version: str, model: str) -> str:
    """Generate deterministic composite hash key: SHA256(content + prompt_version + model)."""
    raw_key = f"{content.strip()}:{prompt_version}:{model}"
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


class AICacheManager:
    """Manages querying and persisting cached LLM evaluations in PostgreSQL/SQLite."""

    @staticmethod
    async def get_cached(
        session: AsyncSession,
        input_hash: str,
    ) -> Optional[AIAnalysisResult]:
        """Fetch previously stored LLM result matching the composite hash."""
        stmt = (
            select(AIAnalysisResult)
            .where(AIAnalysisResult.input_hash == input_hash)
            .order_by(AIAnalysisResult.created_at.desc())
            .limit(1)
        )
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def save_result(
        session: AsyncSession,
        job_id: str,
        provider: str,
        model: str,
        prompt_version: str,
        input_hash: str,
        output_payload: dict,
        confidence: float,
        tokens_used: Optional[int] = None,
    ) -> AIAnalysisResult:
        """Persist fresh LLM evaluation record in database."""
        record = AIAnalysisResult(
            job_id=job_id,
            provider=provider,
            model=model,
            prompt_version=prompt_version,
            input_hash=input_hash,
            output_payload=output_payload,
            confidence=confidence,
            tokens_used=tokens_used,
        )
        session.add(record)
        await session.flush()
        logger.info(
            "Persisted AI evaluation to cache",
            job_id=job_id,
            provider=provider,
            model=model,
            hash=input_hash[:12],
        )
        return record
