"""Abstract Base Collector interface and HTTP resiliency primitives.

Defines lifecycle contract, rate limiting, exponential backoff,
and error classification for all ingestion channels.
"""

from abc import ABC, abstractmethod
import asyncio
from datetime import datetime, timezone
import hashlib
import json
from typing import Any, List, Optional
import httpx
import structlog

from app.config.settings import settings
from app.models.schemas import RawJobIngest

logger = structlog.get_logger()


def calculate_content_hash(payload: Any) -> str:
    """Compute SHA-256 hash over serialized payload for change detection."""
    serialized = json.dumps(payload, sort_keys=True, default=str)
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


class BaseCollector(ABC):
    """Abstract contract that all ingestion collectors must implement."""

    def __init__(
        self,
        source_id: str,
        name: str,
        timeout: Optional[float] = None,
        max_retries: Optional[int] = None,
    ):
        self.source_id = source_id
        self.name = name
        self.timeout = timeout or settings.collector_timeout_seconds
        self.max_retries = max_retries or settings.collector_max_retries
        self.headers = {"User-Agent": settings.collector_user_agent}

    @abstractmethod
    async def collect_for_endpoint(
        self,
        company_name: str,
        endpoint_token: str,
        company_source_id: Optional[str] = None,
    ) -> List[RawJobIngest]:
        """Harvest raw jobs for a single configured company endpoint."""
        pass

    @abstractmethod
    async def test_connection(self) -> bool:
        """Verify endpoint connectivity."""
        pass

    async def _get_with_retry(
        self,
        url: str,
        client: httpx.AsyncClient,
        params: Optional[dict] = None,
        custom_headers: Optional[dict] = None,
    ) -> httpx.Response:
        """Execute HTTP GET with exponential backoff on transient errors."""
        headers = {**self.headers, **(custom_headers or {})}
        delay = 1.0

        for attempt in range(1, self.max_retries + 1):
            try:
                response = await client.get(
                    url, params=params, headers=headers, timeout=self.timeout
                )
                if response.status_code == 429:
                    # Rate limit encountered - back off gracefully
                    retry_after = float(response.headers.get("Retry-After", delay * 2))
                    logger.warning(
                        "Rate limit hit",
                        collector=self.source_id,
                        url=url,
                        retry_after=retry_after,
                        attempt=attempt,
                    )
                    await asyncio.sleep(retry_after)
                    delay = max(delay * 2, retry_after)
                    continue

                response.raise_for_status()
                return response

            except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError) as exc:
                if attempt == self.max_retries:
                    logger.error(
                        "Collector HTTP request failed after max retries",
                        collector=self.source_id,
                        url=url,
                        error=str(exc),
                    )
                    raise
                logger.warning(
                    "Collector HTTP request transient error; retrying",
                    collector=self.source_id,
                    url=url,
                    attempt=attempt,
                    delay=delay,
                    error=str(exc),
                )
                await asyncio.sleep(delay)
                delay *= 2

        raise httpx.RequestError(f"Exhausted retries for {url}")
