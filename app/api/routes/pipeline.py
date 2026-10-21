"""Pipeline and Harvest API routes.

Provides endpoints to trigger immediate ingestion runs and query operational telemetry.
"""

import asyncio
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

import structlog
from app.models.database import get_db_session
from app.models.entities import CollectionRun
from app.scheduling.scheduler import _harvest_lock
from app.services.pipeline import PipelineService, pipeline_tracker

logger = structlog.get_logger()

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

# Tracks active running task to support instant user cancellation
_active_harvest_task: Optional[asyncio.Task] = None


class HarvestTriggerRequest(BaseModel):
    source_id: str = Field("GREENHOUSE", description="Ingestion source platform identifier")
    company_name: str = Field(..., description="Target hiring company name")
    endpoint_token: str = Field(..., description="ATS board token or slug (e.g. 'razorpay')")
    company_source_id: Optional[str] = None


class MatrixHarvestRequest(BaseModel):
    sources: Optional[list[str]] = Field(None, description="List of sources (JOBSPY, CUTSHORT, HIRIST)")
    cities: Optional[list[str]] = Field(None, description="List of target cities")


@router.post("/harvest")
async def trigger_harvest(
    payload: HarvestTriggerRequest,
    session: AsyncSession = Depends(get_db_session),
):
    """Trigger an on-demand harvest pipeline run for a company endpoint with concurrency lock."""
    global _active_harvest_task
    if _harvest_lock.locked():
        raise HTTPException(
            status_code=409,
            detail="A harvest run is currently active. Please wait a moment for it to complete.",
        )

    async with _harvest_lock:
        current_task = asyncio.current_task()
        _active_harvest_task = current_task
        pipeline = PipelineService(session)
        try:
            result = await pipeline.run_endpoint_harvest(
                source_id=payload.source_id,
                company_name=payload.company_name,
                endpoint_token=payload.endpoint_token,
                company_source_id=payload.company_source_id,
            )
            return result
        except asyncio.CancelledError:
            logger.info("Harvest endpoint run cancelled by stop request", source=payload.source_id)
            pipeline_tracker.reset(status="STOPPED", message="Harvest run cancelled by user.")
            try:
                stmt = (
                    select(CollectionRun)
                    .where(CollectionRun.status == "RUNNING")
                    .order_by(desc(CollectionRun.started_at))
                    .limit(1)
                )
                latest_run = (await session.execute(stmt)).scalar_one_or_none()
                if latest_run:
                    latest_run.status = "STOPPED"
                    latest_run.finished_at = datetime.now(timezone.utc)
                    latest_run.error_summary = "Harvest run cancelled by user."
                    await session.commit()
            except Exception as e:
                logger.warning("Could not mark collection run as STOPPED", error=str(e))
            raise HTTPException(status_code=499, detail="Harvest run cancelled by client")
        except Exception as exc:
            logger.error("Harvest route failed", error=str(exc), exc_info=True)
            raise HTTPException(status_code=500, detail=str(exc))
        finally:
            if _active_harvest_task == current_task:
                _active_harvest_task = None


@router.post("/harvest/matrix")
async def trigger_matrix_harvest(
    payload: Optional[MatrixHarvestRequest] = None,
    session: AsyncSession = Depends(get_db_session),
):
    """Trigger an on-demand harvest across the Indian tech search matrix with concurrency lock."""
    global _active_harvest_task
    if _harvest_lock.locked():
        raise HTTPException(
            status_code=409,
            detail="A harvest run is currently active. Please wait a moment for it to complete.",
        )

    async with _harvest_lock:
        current_task = asyncio.current_task()
        _active_harvest_task = current_task
        pipeline = PipelineService(session)
        try:
            sources = payload.sources if payload else None
            cities = payload.cities if payload else None
            result = await pipeline.run_matrix_harvest(sources=sources, cities=cities)
            return result
        except asyncio.CancelledError:
            logger.info("Matrix harvest run cancelled by stop request")
            pipeline_tracker.reset(status="STOPPED", message="Matrix harvest run cancelled by user.")
            try:
                stmt = (
                    select(CollectionRun)
                    .where(CollectionRun.status == "RUNNING")
                    .order_by(desc(CollectionRun.started_at))
                    .limit(1)
                )
                latest_run = (await session.execute(stmt)).scalar_one_or_none()
                if latest_run:
                    latest_run.status = "STOPPED"
                    latest_run.finished_at = datetime.now(timezone.utc)
                    latest_run.error_summary = "Matrix harvest run cancelled by user."
                    await session.commit()
            except Exception as e:
                logger.warning("Could not mark collection run as STOPPED", error=str(e))
            raise HTTPException(status_code=499, detail="Matrix harvest run cancelled by client")
        except Exception as exc:
            logger.error("Matrix harvest route failed", error=str(exc), exc_info=True)
            raise HTTPException(status_code=500, detail=str(exc))
        finally:
            if _active_harvest_task == current_task:
                _active_harvest_task = None


@router.post("/stop")
@router.post("/harvest/stop")
async def stop_active_harvest(
    session: AsyncSession = Depends(get_db_session),
):
    """Cancel any active in-flight harvest pipeline run."""
    global _active_harvest_task
    stopped_task = False
    pipeline_tracker.reset(status="STOPPED", message="Harvest pipeline execution was stopped.")

    if _active_harvest_task and not _active_harvest_task.done():
        logger.info("Cancelling active harvest task via API stop request")
        _active_harvest_task.cancel()
        stopped_task = True

    # Also ensure any lingering RUNNING collection runs are marked STOPPED
    try:
        stmt = (
            select(CollectionRun)
            .where(CollectionRun.status == "RUNNING")
            .order_by(desc(CollectionRun.started_at))
            .limit(1)
        )
        latest_run = (await session.execute(stmt)).scalar_one_or_none()
        if latest_run:
            latest_run.status = "STOPPED"
            latest_run.finished_at = datetime.now(timezone.utc)
            latest_run.error_summary = "Harvest run cancelled by user."
            await session.commit()
    except Exception as e:
        logger.warning("Could not mark lingering collection run as STOPPED", error=str(e))

    if stopped_task:
        return {"status": "STOPPED", "message": "Harvest pipeline execution was stopped."}

    return {"status": "IDLE", "message": "No active harvest run to stop."}


@router.get("/status")
async def get_pipeline_status(
    session: AsyncSession = Depends(get_db_session),
):
    """Return real-time active stage telemetry for in-flight harvest runs."""
    status_data = pipeline_tracker.to_dict()
    if not status_data["is_active"]:
        stmt = (
            select(CollectionRun)
            .where(CollectionRun.status == "RUNNING")
            .order_by(desc(CollectionRun.started_at))
            .limit(1)
        )
        active_db_run = (await session.execute(stmt)).scalar_one_or_none()
        if active_db_run:
            step = 3 if active_db_run.jobs_found > 0 else 1
            stage_name = "Canonical Deduplication" if step == 3 else "Endpoint Handshake"
            status_data.update({
                "is_active": True,
                "run_id": active_db_run.id,
                "step": step,
                "stage_name": stage_name,
                "stage_detail": f"Active harvest for {active_db_run.source_id}",
                "source_id": active_db_run.source_id,
                "jobs_found": active_db_run.jobs_found,
                "status": "RUNNING",
            })
    return status_data


@router.get("/runs")
async def list_runs(
    limit: int = 20,
    session: AsyncSession = Depends(get_db_session),
):
    """List recent collection runs and harvesting metrics."""
    stmt = (
        select(CollectionRun)
        .order_by(desc(CollectionRun.started_at))
        .limit(limit)
    )
    result = await session.execute(stmt)
    runs = result.scalars().all()

    status_data = pipeline_tracker.to_dict()
    if not status_data["is_active"]:
        active_db_run = next((r for r in runs if r.status == "RUNNING"), None)
        if active_db_run:
            step = 3 if active_db_run.jobs_found > 0 else 1
            stage_name = "Canonical Deduplication" if step == 3 else "Endpoint Handshake"
            status_data.update({
                "is_active": True,
                "run_id": active_db_run.id,
                "step": step,
                "stage_name": stage_name,
                "stage_detail": f"Active harvest for {active_db_run.source_id}",
                "source_id": active_db_run.source_id,
                "jobs_found": active_db_run.jobs_found,
                "status": "RUNNING",
            })

    return {
        "runs": [
            {
                "id": r.id,
                "source_id": r.source_id,
                "started_at": r.started_at.isoformat() if r.started_at else None,
                "finished_at": r.finished_at.isoformat() if r.finished_at else None,
                "status": r.status,
                "jobs_found": r.jobs_found,
                "jobs_created": r.jobs_created,
                "jobs_updated": r.jobs_updated,
                "jobs_failed": r.jobs_failed,
                "error_summary": r.error_summary,
            }
            for r in runs
        ],
        "active_stage": status_data,
    }
