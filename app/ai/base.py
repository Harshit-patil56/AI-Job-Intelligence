"""Base LLM Provider Adapter interface."""

from abc import ABC, abstractmethod
import json
import re
from typing import Any, Dict
from pydantic import ValidationError

from app.ai.schemas import JobFitAssessment


def clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """Extract and parse JSON object from raw LLM output text, handling markdown fences."""
    text = raw_text.strip()

    # Extract JSON between ```json and ``` or ``` and ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    else:
        # Alternatively find first '{' and last '}'
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]

    return json.loads(text)


class BaseLLMAdapter(ABC):
    """Abstract interface that all LLM provider adapters must implement."""

    def __init__(self, provider_name: str, model_name: str, timeout: float = 20.0):
        self.provider_name = provider_name
        self.model_name = model_name
        self.timeout = timeout

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True if required API credentials or local endpoints are present."""
        pass

    @abstractmethod
    async def generate_assessment(
        self,
        user_prompt: str,
        system_prompt: str,
    ) -> tuple[JobFitAssessment, int | None]:
        """Execute model inference and return parsed JobFitAssessment and optional tokens_used."""
        pass
