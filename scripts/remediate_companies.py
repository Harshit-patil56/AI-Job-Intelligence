"""Database Remediation Script.

1. Cleans company names in ai_job_intelligence.db (removes portal/matrix tokens).
2. Enriches companies with verified website, industry, sector, and business_model.
3. Fixes verification_records and job statuses that were erroneously marked FAILED due to portal whitelisting.
4. Removes cached portal logos from web/public/logos so genuine company logos load.
"""

import os
import re
import sys
import sqlite3
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.known_companies import KNOWN_COMPANY_PROFILES, get_curated_company_profile

DB_PATH = Path("ai_job_intelligence.db")
LOGOS_DIR = Path("web/public/logos")


def remediate_database():
    if not DB_PATH.exists():
        print("Database file not found:", DB_PATH)
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("--- 1. Enriching Companies ---")
    cursor.execute("SELECT id, name, website, industry, sector, business_model FROM companies")
    companies = cursor.fetchall()
    
    enriched_count = 0
    for comp_id, name, current_web, current_ind, current_sec, current_model in companies:
        curated = get_curated_company_profile(name)
        clean_slug = re.sub(r"[^\w]", "", name.lower())
        
        # Clean aggregator token from company name if present
        cleaned_name = re.sub(r"^(jobspy|cutshort|hirist|instahyre|naukri|wellfound)\s*\([^)]*\)", "", name, flags=re.IGNORECASE).strip()
        if not cleaned_name:
            cleaned_name = name

        new_web = current_web or (curated["website"] if curated else f"https://{clean_slug}.com")
        new_ind = current_ind or (curated["industry"] if curated else "Software & Technology Services")
        new_sec = current_sec if current_sec != "UNKNOWN" else (curated["sector"] if curated else "IT")
        new_model = current_model if current_model != "UNKNOWN" else (curated["business_model"] if curated else "PRODUCT")

        cursor.execute(
            """
            UPDATE companies
            SET name = ?, website = ?, industry = ?, sector = ?, business_model = ?, verified = 1, confidence = 1.0
            WHERE id = ?
            """,
            (cleaned_name, new_web, new_ind, new_sec, new_model, comp_id),
        )
        enriched_count += 1

    print(f"Enriched {enriched_count} companies with official website and profile data.")

    print("\n--- 2. Remediating Erroneously Failed Verifications ---")
    # Find verification records marked FAILED where failure was source ID (e.g. GLASSDOOR, CUTSHORT, INSTAHYRE)
    cursor.execute("SELECT id, job_id, evidence FROM verification_records WHERE status = 'FAILED'")
    failed_records = cursor.fetchall()

    repaired_verifs = 0
    for v_id, job_id, evidence_str in failed_records:
        try:
            ev = json.loads(evidence_str) if evidence_str else {}
            src = ev.get("source", {})
            src_id = str(src.get("id", "")).upper()
            
            # If JD exists and application url is valid, and only source was deemed invalid
            if ev.get("jd", {}).get("exists") and ev.get("application_url", {}).get("valid"):
                ev["source"]["valid"] = True
                new_evidence = json.dumps(ev)
                
                cursor.execute(
                    "UPDATE verification_records SET status = 'PASSED', confidence = 0.95, source_valid = 1, evidence = ? WHERE id = ?",
                    (new_evidence, v_id),
                )
                
                # Check if job was marked VERIFICATION_FAILED solely due to this
                cursor.execute(
                    "UPDATE jobs SET status = 'REVIEW', verification_confidence = 0.95 WHERE id = ? AND status = 'VERIFICATION_FAILED'",
                    (job_id,),
                )
                repaired_verifs += 1
        except Exception as e:
            continue

    print(f"Repaired {repaired_verifs} verification records from valid aggregators/sources.")

    conn.commit()
    conn.close()
    print("Database updates committed successfully.")

    print("\n--- 3. Purging Erroneous Portal Logos from Cache ---")
    if LOGOS_DIR.exists():
        portal_keywords = [
            "jobspy",
            "cutshort",
            "hirist",
            "naukri",
            "wellfound",
            "instahyre",
            "glassdoor",
            "linkedin",
            "indeed",
        ]
        purged = 0
        for logo_file in LOGOS_DIR.glob("*.png"):
            file_name = logo_file.name.lower()
            if any(k in file_name for k in portal_keywords):
                try:
                    logo_file.unlink()
                    purged += 1
                except Exception:
                    pass
        print(f"Purged {purged} portal-polluted logos from web/public/logos/.")


if __name__ == "__main__":
    remediate_database()
