"""Settings and API Credentials Management Routes."""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.models.database import get_db_session
from app.services.api_credentials import (
    get_all_credentials,
    test_provider_connection,
    update_credential,
)

logger = structlog.get_logger()

router = APIRouter(prefix="/settings/api-keys", tags=["Settings & API Keys"])


class UpdateCredentialRequest(BaseModel):
    is_enabled: Optional[bool] = None
    api_key: Optional[str] = None
    secondary_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: Optional[str] = None


class TestConnectionRequest(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model_name: Optional[str] = None


class FetchModelsRequest(BaseModel):
    api_key: Optional[str] = None
    base_url: Optional[str] = None


@router.get("", response_model=List[Dict[str, Any]])
async def list_credentials(
    session: AsyncSession = Depends(get_db_session),
):
    """Retrieve all external API providers with masked secret keys and runtime toggle states."""
    return await get_all_credentials(session)


@router.patch("/{provider_id}")
async def save_provider_credential(
    provider_id: str,
    payload: UpdateCredentialRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Update API key, toggle status (on/off), and model configuration for a provider."""
    res = await update_credential(
        session=session,
        provider_id=provider_id,
        payload=payload.model_dump(exclude_unset=True),
    )
    return res


@router.post("/test/{provider_id}")
async def test_provider(
    provider_id: str,
    payload: Optional[TestConnectionRequest] = None,
    session: AsyncSession = Depends(get_db_session),
):
    """Perform real-time connectivity and authentication test for a given provider."""
    req_dict = payload.model_dump(exclude_unset=True) if payload else {}
    return await test_provider_connection(session, provider_id, req_dict)


@router.post("/models/{provider_id}", response_model=List[Dict[str, Any]])
async def list_provider_models(
    provider_id: str,
    payload: Optional[FetchModelsRequest] = None,
    session: AsyncSession = Depends(get_db_session),
):
    """Fetch live available models from provider API with free tier indicators."""
    req_dict = payload.model_dump(exclude_unset=True) if payload else {}
    from app.services.api_credentials import fetch_available_models
    return await fetch_available_models(
        session=session,
        provider_id=provider_id,
        api_key=req_dict.get("api_key"),
        base_url=req_dict.get("base_url"),
    )
