import asyncio
from sqlalchemy import select
from app.models.database import AsyncSessionLocal
from app.models.entities import Job, RawJob, JobSourceReference
from app.normalization.salary_parser import parse_salary, format_salary_display, estimate_market_salary


async def backfill():
    async with AsyncSessionLocal() as session:
        jobs = (await session.execute(select(Job))).scalars().all()
        print(f"Total jobs to inspect: {len(jobs)}")
        updated = 0
        for j in jobs:
            # 1. Check raw jobs linked
            refs_stmt = (
                select(JobSourceReference, RawJob)
                .join(RawJob, JobSourceReference.raw_job_id == RawJob.id)
                .where(JobSourceReference.job_id == j.id)
            )
            refs = (await session.execute(refs_stmt)).all()

            raw_sal_min = None
            raw_sal_max = None
            raw_sal_curr = "INR"
            raw_sal_period = "ANNUAL"
            raw_sal_text = None

            for ref, rj in refs:
                p = rj.raw_payload or {}
                if p.get("salary_min") or p.get("min_amount"):
                    raw_sal_min = p.get("salary_min") or p.get("min_amount")
                if p.get("salary_max") or p.get("max_amount"):
                    raw_sal_max = p.get("salary_max") or p.get("max_amount")
                if p.get("salary_currency") or p.get("currency"):
                    raw_sal_curr = p.get("salary_currency") or p.get("currency")
                if p.get("salary_period") or p.get("interval"):
                    raw_sal_period = p.get("salary_period") or p.get("interval")
                if p.get("salary_text") or p.get("salaryRangeText") or p.get("compensation"):
                    raw_sal_text = p.get("salary_text") or p.get("salaryRangeText") or p.get("compensation")

            analysis = None
            if raw_sal_min is not None or raw_sal_max is not None:
                try:
                    s_min = float(raw_sal_min) if raw_sal_min is not None else None
                    s_max = float(raw_sal_max) if raw_sal_max is not None else s_min
                    ann_min, ann_max = s_min, s_max
                    if str(raw_sal_period).upper() in ("MONTHLY", "MONTH", "MO"):
                        ann_min = s_min * 12.0 if s_min else None
                        ann_max = s_max * 12.0 if s_max else None
                    disp = format_salary_display(s_min, s_max, raw_sal_curr, raw_sal_period, str(raw_sal_text) if raw_sal_text else None)
                    analysis = (
                        s_min,
                        s_max,
                        str(raw_sal_curr).upper(),
                        "MONTHLY" if str(raw_sal_period).upper() in ("MONTHLY", "MO") else "ANNUAL",
                        disp,
                    )
                except Exception:
                    pass

            if not analysis:
                full_text = f"{raw_sal_text or ''}\n{j.description}"
                parsed = parse_salary(full_text)
                if parsed.annual_min is not None:
                    analysis = (
                        parsed.salary_min,
                        parsed.salary_max,
                        parsed.salary_currency,
                        parsed.salary_period.value,
                        parsed.salary_text,
                    )

            if not analysis:
                title_lower = j.canonical_title.lower()
                role_p = (
                    "P1"
                    if any(k in title_lower for k in ("genai", "generative ai", "llm", "agent", "prompt"))
                    else (
                        "P2"
                        if any(k in title_lower for k in ("backend", "distributed", "data engineer", "platform"))
                        else (
                            "P3"
                            if any(k in title_lower for k in ("software", "full stack", "frontend", "developer", "engineer"))
                            else "OTHER"
                        )
                    )
                )
                est = estimate_market_salary(role_p, j.experience_min, j.experience_max, j.location)
                analysis = (
                    est.salary_min,
                    est.salary_max,
                    est.salary_currency,
                    est.salary_period.value,
                    est.salary_text,
                )

            j.salary_min = analysis[0]
            j.salary_max = analysis[1]
            j.salary_currency = analysis[2]
            j.salary_period = analysis[3]
            j.salary_text = analysis[4]
            updated += 1

        await session.commit()
        print(f"Successfully backfilled salary for {updated} jobs!")


if __name__ == "__main__":
    asyncio.run(backfill())
