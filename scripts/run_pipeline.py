"""CLI Pipeline Runner and Ingestion Validator.

Executes an end-to-end harvest and verification pipeline run from the command line,
printing results, eligibility decisions, and audit reason codes.
"""

import argparse
import asyncio
from datetime import datetime
import structlog
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.database import AsyncSessionLocal, init_db
from app.models.entities import Job
from app.services.pipeline import PipelineService

logger = structlog.get_logger()


async def run_cli_pipeline(
    source_id: str,
    company_name: str,
    endpoint_token: str,
    display_limit: int = 15,
):
    """Run harvest pipeline for an endpoint and print tabular output."""
    await init_db()
    print("=" * 80)
    print(f"  AI Job Intelligence - CLI Pipeline Ingestion Run")
    print(f"  Source: {source_id} | Company: {company_name} | Endpoint: {endpoint_token}")
    print(f"  Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    async with AsyncSessionLocal() as session:
        pipeline = PipelineService(session)
        result = await pipeline.run_endpoint_harvest(
            source_id=source_id,
            company_name=company_name,
            endpoint_token=endpoint_token,
        )

        print("\n--- Pipeline Execution Summary ---")
        print(f"Status:       {result.get('status')}")
        print(f"Jobs Found:   {result.get('jobs_found')}")
        print(f"Jobs Created: {result.get('jobs_created')}")
        print(f"Jobs Updated: {result.get('jobs_updated')}")
        print(f"Jobs Failed:  {result.get('jobs_failed')}")
        print(f"Run ID:       {result.get('run_id')}")

        # Query newly created or updated jobs
        stmt = (
            select(Job)
            .options(
                selectinload(Job.company),
                selectinload(Job.source_references),
            )
            .order_by(Job.created_at.desc())
            .limit(display_limit)
        )
        jobs = (await session.execute(stmt)).scalars().all()

        print("\n" + "=" * 110)
        print(f"{'STATUS':<12} | {'PRIORITY':<8} | {'ROLE TITLE':<32} | {'LOCATION':<20} | {'REASON / DETAILS'}")
        print("-" * 110)

        for job in jobs:
            reason = job.rejection_reason or job.review_reason or "All checks passed"
            title_trunc = job.canonical_title[:30]
            loc_trunc = job.location[:18]
            print(f"{job.status:<12} | {job.role_priority:<8} | {title_trunc:<32} | {loc_trunc:<20} | {reason}")

        print("=" * 110)


def main():
    parser = argparse.ArgumentParser(description="AI Job Intelligence Pipeline Runner")
    parser.add_argument("--source", default="GREENHOUSE", help="Ingestion source (GREENHOUSE, JOBSPY)")
    parser.add_argument("--company", default="Razorpay", help="Company display name")
    parser.add_argument("--endpoint", default="razorpay", help="Board token or search query (e.g. 'razorpay' or 'AI Engineer|Mumbai')")
    parser.add_argument("--limit", type=int, default=15, help="Display item limit")

    args = parser.parse_args()
    asyncio.run(
        run_cli_pipeline(
            source_id=args.source,
            company_name=args.company,
            endpoint_token=args.endpoint,
            display_limit=args.limit,
        )
    )


if __name__ == "__main__":
    main()
