"""OpenRouter Provider Adapter."""

from typing import Optional
import httpx
import structlog

from app.ai.base import BaseLLMAdapter, clean_and_parse_json
from app.ai.schemas import JobFitAssessment
from app.config.settings import settings

logger = structlog.get_logger()

OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions"


class OpenRouterAdapter(BaseLLMAdapter):
    """Async HTTP adapter for OpenRouter free/candidate models."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        super().__init__(
            provider_name="OPENROUTER",
            model_name=model_name or settings.openrouter_model,
            timeout=timeout or settings.llm_timeout_seconds,
        )
        self.api_key = api_key or settings.openrouter_api_key

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_assessment(
        self,
        user_prompt: str,
        system_prompt: str,
    ) -> tuple[JobFitAssessment, int | None]:
        if not self.is_configured():
            raise RuntimeError("OpenRouterAdapter is not configured with an API key")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/TANMAY4806w/AI-Job-Intelligence",
            "X-Title": "AI Job Intelligence Platform",
        }

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(OPENROUTER_ENDPOINT, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"OpenRouter API returned HTTP {resp.status_code}: {resp.text[:300]}"
                )

            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                raise RuntimeError("OpenRouter API returned zero choices")

            content_text = choices[0].get("message", {}).get("content", "{}")
            tokens_used = data.get("usage", {}).get("total_tokens")

            parsed_dict = clean_and_parse_json(content_text)
            assessment = JobFitAssessment.model_validate(parsed_dict)
            return assessment, tokens_used
