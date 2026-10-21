"""LLM Gateway Router implementing ADR-007, ADR-008, and ADR-009.

Provides provider-agnostic LLM inference with automatic multi-cloud failover,
local runtime fallback (Ollama), and deterministic composite SHA256 caching.
"""

import time
from typing import Dict, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.ai.adapters.fallback import DeterministicFallbackAdapter
from app.ai.adapters.gemini import GeminiAdapter
from app.ai.adapters.groq import GroqAdapter
from app.ai.adapters.ollama import OllamaAdapter
from app.ai.adapters.openrouter import OpenRouterAdapter
from app.ai.base import BaseLLMAdapter
from app.ai.cache import AICacheManager, calculate_input_hash
from app.ai.prompts import PROMPT_VERSION, SYSTEM_PROMPT, build_user_prompt
from app.ai.schemas import JobFitAssessment, LLMResponse
from app.config.settings import settings

logger = structlog.get_logger()


class LLMGateway:
    """Central provider-agnostic LLM gateway coordinating inference, failover, and caching."""

    def __init__(self):
        self._adapters: List[BaseLLMAdapter] = [
            GeminiAdapter(),
            GroqAdapter(),
            OpenRouterAdapter(),
            OllamaAdapter(),
            DeterministicFallbackAdapter(),
        ]
        # Tracks provider cooldown expiration timestamps (unix epoch)
        self._cooldowns: Dict[str, float] = {}
        self.cooldown_duration_seconds = 60.0

    def get_configured_adapters(self) -> List[BaseLLMAdapter]:
        """Return list of adapters whose configuration/credentials are present."""
        return [adapter for adapter in self._adapters if adapter.is_configured()]

    def is_in_cooldown(self, provider_name: str) -> bool:
        """Check if provider is temporarily suspended due to recent 429/timeout."""
        expiry = self._cooldowns.get(provider_name, 0.0)
        return time.time() < expiry

    def set_cooldown(self, provider_name: str) -> None:
        """Mark provider in cooldown for cooldown_duration_seconds."""
        self._cooldowns[provider_name] = time.time() + self.cooldown_duration_seconds
        logger.warning(
            "Provider placed in temporary cooldown",
            provider=provider_name,
            cooldown_seconds=self.cooldown_duration_seconds,
        )

    async def evaluate_job(
        self,
        session: AsyncSession,
        job_id: str,
        company: str,
        title: str,
        description: str,
        location: Optional[str] = None,
        experience: Optional[str] = None,
        force_refresh: bool = False,
    ) -> LLMResponse:
        """Evaluate a job posting against early-career criteria with cache-first resolution."""
        configured_adapters = self.get_configured_adapters()
        if not configured_adapters:
            # Fallback is always configured, but guard just in case
            configured_adapters = [DeterministicFallbackAdapter()]

        # 1. Check deterministic cache using primary candidate model
        primary_adapter = configured_adapters[0]
        input_hash = calculate_input_hash(
            content=description,
            prompt_version=PROMPT_VERSION,
            model=primary_adapter.model_name,
        )

        if not force_refresh:
            cached = await AICacheManager.get_cached(session, input_hash)
            if cached and cached.output_payload:
                logger.info(
                    "Serving AI evaluation from deterministic cache",
                    job_id=job_id,
                    provider=cached.provider,
                    model=cached.model,
                    hash=input_hash[:12],
                )
                assessment = JobFitAssessment.model_validate(cached.output_payload)
                return LLMResponse(
                    provider=cached.provider,
                    model=cached.model,
                    prompt_version=cached.prompt_version,
                    input_hash=cached.input_hash,
                    parsed=assessment,
                    tokens_used=cached.tokens_used,
                    latency_ms=0.0,
                    from_cache=True,
                )

        # 2. Build standardized prompt
        user_prompt = build_user_prompt(
            company=company,
            title=title,
            location=location,
            experience=experience,
            description=description,
        )

        last_error: Optional[Exception] = None

        # 3. Cascade through active adapters with failover
        for adapter in configured_adapters:
            if self.is_in_cooldown(adapter.provider_name):
                logger.info("Skipping provider in cooldown", provider=adapter.provider_name)
                continue

            t0 = time.time()
            try:
                logger.info(
                    "Invoking LLM Gateway adapter",
                    provider=adapter.provider_name,
                    model=adapter.model_name,
                    job_id=job_id,
                )
                assessment, tokens_used = await adapter.generate_assessment(
                    user_prompt=user_prompt,
                    system_prompt=SYSTEM_PROMPT,
                )
                latency_ms = round((time.time() - t0) * 1000.0, 2)

                # Persist to database cache
                await AICacheManager.save_result(
                    session=session,
                    job_id=job_id,
                    provider=adapter.provider_name,
                    model=adapter.model_name,
                    prompt_version=PROMPT_VERSION,
                    input_hash=input_hash,
                    output_payload=assessment.model_dump(),
                    confidence=assessment.confidence,
                    tokens_used=tokens_used,
                )

                return LLMResponse(
                    provider=adapter.provider_name,
                    model=adapter.model_name,
                    prompt_version=PROMPT_VERSION,
                    input_hash=input_hash,
                    parsed=assessment,
                    tokens_used=tokens_used,
                    latency_ms=latency_ms,
                    from_cache=False,
                )

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Adapter inference failed, cascading to next adapter",
                    provider=adapter.provider_name,
                    error=str(exc),
                )
                self.set_cooldown(adapter.provider_name)
                continue

        # If all active providers failed, use deterministic fallback directly
        fallback = DeterministicFallbackAdapter()
        assessment, _ = await fallback.generate_assessment(user_prompt, SYSTEM_PROMPT)
        return LLMResponse(
            provider=fallback.provider_name,
            model=fallback.model_name,
            prompt_version=PROMPT_VERSION,
            input_hash=input_hash,
            parsed=assessment,
            tokens_used=0,
            latency_ms=1.0,
            from_cache=False,
        )
