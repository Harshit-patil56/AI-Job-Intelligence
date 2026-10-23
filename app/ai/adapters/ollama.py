"""Local Ollama Runtime Adapter (ADR-008)."""

from typing import Optional
import httpx
import structlog

from app.ai.base import BaseLLMAdapter, clean_and_parse_json
from app.ai.schemas import JobFitAssessment
from app.config.settings import settings

logger = structlog.get_logger()


class OllamaAdapter(BaseLLMAdapter):
    """Local offline inference adapter via Ollama runtime."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: Optional[float] = None,
    ):
        super().__init__(
            provider_name="OLLAMA",
            model_name=model_name or settings.ollama_model,
            timeout=timeout or 30.0,
        )
        raw_url = base_url or settings.ollama_base_url
        self.base_url = raw_url.rstrip("/") if raw_url else None

    def is_configured(self) -> bool:
        return bool(self.base_url and self.base_url.strip())

    async def generate_assessment(
        self,
        user_prompt: str,
        system_prompt: str,
    ) -> tuple[JobFitAssessment, int | None]:
        url = f"{self.base_url}/api/chat"

        payload = {
            "model": self.model_name,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "format": "json",
            "stream": False,
            "options": {"temperature": 0.1},
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise RuntimeError(
                    f"Ollama local runtime returned HTTP {resp.status_code}: {resp.text[:200]}"
                )

            data = resp.json()
            message = data.get("message", {})
            content_text = message.get("content", "{}")
            eval_count = data.get("eval_count")

            parsed_dict = clean_and_parse_json(content_text)
            assessment = JobFitAssessment.model_validate(parsed_dict)
            return assessment, eval_count
