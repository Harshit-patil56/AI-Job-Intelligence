"""Command-line interface for triggering on-demand harvest runs.

Usage:
    python scripts/run_harvest.py --source GREENHOUSE --company razorpay --token razorpay
    python scripts/run_harvest.py --source JOBSPY --company stripe --token stripe
    python scripts/run_harvest.py --all      # harvest all active company sources in DB

This script is identical in behavior to calling POST /pipeline/harvest via the API —
it drives the same PipelineService, the same collectors, and the same persistence layer.
"""

import argparse
import asyncio
from pathlib import Path
import sys
from typing import List, Optional

# Ensure the project root is on the path regardless of cwd
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import structlog

from app.models.database import AsyncSessionLocal, close_db, init_db
from app.services.company_service import CompanyService
from app.services.pipeline import PipelineService

logger = structlog.get_logger()


async def harvest_single(source: str, company: str, token: str) -> None:
    """Harvest a single company/source endpoint end-to-end."""
    await init_db()
    async with AsyncSessionLocal() as session:
        pipeline = PipelineService(session)
        result = await pipeline.run_endpoint_harvest(
            source_id=source.upper(),
            company_name=company,
            endpoint_token=token,
        )
    logger.info("Single harvest complete", **result)
    await close_db()


async def harvest_all() -> None:
    """Harvest every active company source registered in the database."""
    await init_db()
    async with AsyncSessionLocal() as session:
        company_service = CompanyService(session)
        pipeline = PipelineService(session)
        active_sources = await company_service.list_active_company_sources()

        if not active_sources:
            logger.warning("No active company sources found in database — nothing to harvest")
            await close_db()
            return

        logger.info("Starting full harvest run", active_source_count=len(active_sources))
        for cs in active_sources:
            if not cs.ats_identifier:
                logger.info(
                    "Skipping source with no ATS identifier",
                    company=cs.company.name,
                    source=cs.source_id,
                )
                continue
            try:
                result = await pipeline.run_endpoint_harvest(
                    source_id=cs.source_id,
                    company_name=cs.company.name,
                    endpoint_token=cs.ats_identifier,
                    company_source_id=cs.id,
                )
                logger.info(
                    "Source harvested",
                    company=cs.company.name,
                    source=cs.source_id,
                    **result,
                )
            except Exception as exc:
                logger.error(
                    "Harvest failed for source",
                    company=cs.company.name,
                    source=cs.source_id,
                    error=str(exc),
                )

    logger.info("Full harvest run complete")
    await close_db()


async def harvest_matrix(sources: Optional[List[str]] = None) -> None:
    """Harvest across configured Indian tech search matrix."""
    await init_db()
    async with AsyncSessionLocal() as session:
        pipeline = PipelineService(session)
        result = await pipeline.run_matrix_harvest(sources=sources)
    logger.info("Indian tech search matrix harvest complete", **result)
    await close_db()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="run_harvest",
        description="AI Job Intelligence — on-demand harvest CLI",
    )
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument(
        "--all",
        action="store_true",
        help="Harvest all active company sources stored in the database",
    )
    mode.add_argument(
        "--matrix",
        action="store_true",
        help="Harvest Indian tech search matrix across portals (JobSpy, Cutshort, Hirist)",
    )
    mode.add_argument(
        "--source",
        metavar="SOURCE_ID",
        help="Source platform identifier (e.g. GREENHOUSE, LEVER, ASHBY, JOBSPY, CUTSHORT, HIRIST)",
    )
    parser.add_argument(
        "--matrix-sources",
        metavar="SOURCES",
        help="Comma-separated list of sources for matrix run (e.g. CUTSHORT,JOBSPY)",
    )
    parser.add_argument(
        "--company",
        metavar="COMPANY_NAME",
        help="Company display name (required with --source)",
    )
    parser.add_argument(
        "--token",
        metavar="ENDPOINT_TOKEN",
        help="ATS board token or slug (required with --source)",
    )
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()

    if args.all:
        asyncio.run(harvest_all())
    elif args.matrix:
        srcs = [s.strip() for s in args.matrix_sources.split(",")] if args.matrix_sources else None
        asyncio.run(harvest_matrix(sources=srcs))
    else:
        if not args.company or not args.token:
            parser.error("--company and --token are required when using --source")
        asyncio.run(harvest_single(args.source, args.company, args.token))


if __name__ == "__main__":
    main()

