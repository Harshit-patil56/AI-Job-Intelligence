"""Google Gemini Cloud Provider Adapter."""

from typing import Optional
import httpx
import structlog

from app.ai.base import BaseLLMAdapter, clean_and_parse_json
from app.ai.schemas import JobFitAssessment
from app.config.settings import settings

logger = structlog.get_logger()

GEMINI_API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"


class GeminiAdapter(BaseLLMAdapter):
    """Native async HTTP adapter for Google Gemini free-tier REST API."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        super().__init__(
            provider_name="GEMINI",
            model_name=model_name or settings.gemini_model,
            timeout=timeout or settings.llm_timeout_seconds,
        )
        self.api_key = api_key or settings.gemini_api_key

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    async def generate_assessment(
        self,
        user_prompt: str,
        system_prompt: str,
    ) -> tuple[JobFitAssessment, int | None]:
        if not self.is_configured():
            raise RuntimeError("GeminiAdapter is not configured with an API key")

        url = GEMINI_API_ENDPOINT.format(model=self.model_name)
        params = {"key": self.api_key}

        payload = {
            "system_instruction": {"parts": [{"text": system_prompt}]},
            "contents": [{"parts": [{"text": user_prompt}]}],
            "generationConfig": {
                "response_mime_type": "application/json",
                "temperature": 0.1,
            },
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, params=params, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Gemini API returned HTTP {resp.status_code}: {resp.text[:300]}"
                )

            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                raise RuntimeError("Gemini API returned zero candidates")

            content_text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
            tokens_used = data.get("usageMetadata", {}).get("totalTokenCount")

            parsed_dict = clean_and_parse_json(content_text)
            assessment = JobFitAssessment.model_validate(parsed_dict)
            return assessment, tokens_used
