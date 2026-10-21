"""Groq Cloud Provider Adapter."""

from typing import Optional
import httpx
import structlog

from app.ai.base import BaseLLMAdapter, clean_and_parse_json
from app.ai.schemas import JobFitAssessment
from app.config.settings import settings

logger = structlog.get_logger()

GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions"


class GroqAdapter(BaseLLMAdapter):
    """High-speed async HTTP adapter for Groq Cloud API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        super().__init__(
            provider_name="GROQ",
            model_name=model_name or settings.groq_model,
            timeout=timeout or settings.llm_timeout_seconds,
        )
        self.api_key = api_key or settings.groq_api_key

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_assessment(
        self,
        user_prompt: str,
        system_prompt: str,
    ) -> tuple[JobFitAssessment, int | None]:
        if not self.is_configured():
            raise RuntimeError("GroqAdapter is not configured with an API key")

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
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
            resp = await client.post(GROQ_ENDPOINT, headers=headers, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Groq API returned HTTP {resp.status_code}: {resp.text[:300]}"
                )

            data = resp.json()
            choices = data.get("choices", [])
            if not choices:
                raise RuntimeError("Groq API returned zero choices")

            content_text = choices[0].get("message", {}).get("content", "{}")
            tokens_used = data.get("usage", {}).get("total_tokens")

            parsed_dict = clean_and_parse_json(content_text)
            assessment = JobFitAssessment.model_validate(parsed_dict)
            return assessment, tokens_used
