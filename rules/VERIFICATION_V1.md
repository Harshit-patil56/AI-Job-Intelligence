# Verification Dimensions & Confidence Rules (V1)

> **Document Type:** Verification & Auditability Specification  
> **Status:** Approved Baseline  
> **Version:** 1.0  
> **Reference Specification:** [`V1_SPECIFICATION.md`](../docs/requirements/V1_SPECIFICATION.md)  
> **Data Contract:** [`JOB_DATA_CONTRACT.md`](../docs/requirements/JOB_DATA_CONTRACT.md)

---

## 1. Philosophy: Multi-Dimensional & Confidence-Aware
Verification in **AI Job Intelligence** rejects the naive single-boolean approach. A job posting is rarely completely "valid" or completely "invalid" in a single binary check. 

Instead, verification operates under three guiding principles:
1. **Granular Independence:** Each critical dimension of a job posting is verified independently.
2. **Auditability & Traceability:** Every check must yield explicit, inspectable outcomes and machine-readable reason codes.
3. **Maximum Recall on Incomplete Data:** Missing or unknown information must trigger **`KEEP`** or **`REVIEW`**, never automatic rejection.

---

## 2. The Eight Verification Dimensions

The system evaluates eight discrete verification dimensions:

| # | Dimension | Associated Contract Field | Evaluation Objective | Success Criteria | Failure / Missing Handling |
| :- | :--- | :--- | :--- | :--- | :--- |
| **1** | **Source Validity** | `source_verified` | Is the origin platform legitimate, supported, and uncompromised? | Source is in approved source registry; payload matches expected protocol. | Fail -> `eligibility_status = VERIFICATION_FAILED`, reason `SOURCE_INVALID`. |
| **2** | **Actual JD Existence** | `jd_verified` | Does the job description body actually exist and contain coherent job content? | Non-empty body (> 100 characters), active page (not 404/expired/tombstone). | Fail -> `eligibility_status = VERIFICATION_FAILED`, reason `JD_NOT_FOUND` or `JD_EXPIRED`. |
| **3** | **Application URL Validity** | `application_url` | Is the application link or ATS endpoint reachable and syntactically valid? | Valid HTTPS URI; returns accessible HTTP status code (200/301/302). | If invalid -> Fallback to `source_url`. If both broken, set `review_reason = APPLICATION_LINK_BROKEN`. |
| **4** | **Company Legitimacy** | `company_verified` | Is the hiring company an identifiable, verifiable real-world entity? | Matches verified company registry or has verifiable domain. | If unverified -> `company_verified = false`, `review_reason = COMPANY_UNVERIFIED`. **Do NOT reject.** |
| **5** | **Location Consistency** | `location_verified` | Is the reported location explicitly confirmed in the JD text? | JD text or metadata matches approved P1/P2 cities or remote clause. | If remote with company outside P1/P2 -> `review_reason = LOCATION_REMOTE_REVIEW`. If ambiguous -> `location_verified = false`, `review_reason = LOCATION_AMBIGUOUS`. |
| **6** | **Experience Consistency** | `experience_verified` | Is the stated experience requirement substantiated by the JD text? | Stated experience meets target bands (Fresher, 0–1, 0–2, 1–2 yrs). Min $\ge 2$ yrs (2–3, 2–4, 2–5, 3+) or Senior/Lead -> `REJECTED` (`EXPERIENCE_TOO_HIGH`). | If 1–3 years or minimum experience is ambiguous/unstated -> `experience_verified = false`, `review_reason = EXPERIENCE_AMBIGUOUS`. |
| **7** | **Salary Statedness** | `salary_verified` | Is compensation explicitly disclosed and verified against realistic norms? | Numeric salary values present and parseable into minimum/maximum bands. | If unstated -> `salary_verified = false`, `review_reason = SALARY_UNKNOWN`. **Do NOT reject.** |
| **8** | **Posting Date Plausibility** | `posted_at` check | Is the posting date logically plausible and not in the future or corrupted? | $T_{collected} \ge T_{posted} \ge (T_{collected} - 90\text{ days})$. | If invalid/missing -> Fallback to `collected_at`, flag `review_reason = POSTED_DATE_SUSPICIOUS`. |

---

## 3. Verification Confidence Metric (`verification_confidence`)

Rather than an arbitrary pass/fail cutoff, each job record carries a composite confidence score ($C \in [0.0, 1.0]$) reflecting data completeness and authenticity.

### 3.1 Confidence Weighting Schema
- **JD Authenticity (`jd_verified`):** 30% weight (Fundamental prerequisite)
- **Source Trust (`source_verified`):** 20% weight (Platform reliability)
- **Company Legitimacy (`company_verified`):** 20% weight
- **Experience Clarity (`experience_verified`):** 15% weight
- **Location Consistency (`location_verified`):** 10% weight
- **Salary Disclosure (`salary_verified`):** 5% weight

$$\text{Confidence Score} = \sum (\text{Dimension Score} \times \text{Weight})$$

### 3.2 Confidence Tiers
- **High Confidence ($C \ge 0.85$):** Complete data, fully verified across all core dimensions.
- **Moderate Confidence ($0.60 \le C < 0.85$):** Core JD and source are authentic, but secondary fields (e.g., salary or specific experience band) are ambiguous or unstated. Directly eligible for feed with `REVIEW` tags.
- **Low Confidence ($C < 0.60$):** Multiple dimensions missing or unverified. Routed to dedicated review queue.

---

## 4. Unknown Data Protocols (Enforcing Maximum Recall)

To ensure no viable opportunity is lost due to missing fields:

### 4.1 Missing Salary Protocol
- Most Indian tech openings omit explicit salary figures on initial job boards.
- **Action:** Set `salary_verified = false`.
- **Eligibility Impact:** **Zero negative impact on eligibility.** The job proceeds to the feed with `review_reason = SALARY_UNKNOWN`.

### 4.2 Missing or Ambiguous Experience Protocol
- When a posting states "relevant experience required" without numeric bounds or lists "Fresher/Experienced":
- **Action:** Set `experience_verified = false`.
- **Eligibility Impact:** Marked as `eligibility_status = REVIEW` with `review_reason = EXPERIENCE_AMBIGUOUS`. Kept visible to human reviewers.

### 4.3 Unknown Company Classification Protocol
- When a company has `sector = UNKNOWN` or `business_model = UNKNOWN`:
- **Action:** Retain company record as `UNKNOWN`.
- **Eligibility Impact:** **Must NOT cause automatic rejection.** The job remains active in the discovery pipeline.

### 4.4 Remote Role Location Protocol
- When a posting has `remote_type = REMOTE` and the company/head office is located outside P1/P2 hubs:
- **Action:** Set `location_verified = true` (or pending) and route to **`REVIEW`**.
- **Eligibility Impact:** **Must NOT cause automatic rejection.** Marked with `review_reason = LOCATION_REMOTE_REVIEW` until remote policies are finalized.

### 4.5 Cross-Source Attribute Conflict Protocol
- When multiple sources report conflicting data on material attributes (experience, salary, location, posting date):
- **Action:** Preserve all source payloads in their respective `JobSourceReference` records, mark the canonical attribute as uncertain.
- **Eligibility Impact:** If the conflict impacts eligibility, route to **`REVIEW`** with `review_reason = SOURCE_CONFLICT_REVIEW`.

---

## 5. Failure vs. Review Distinction

To prevent false negatives and maintain auditability:

```text
                               Verification Event
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
 [Hard Technical Failure]                                   [Information Ambiguity / Discrepancy]
 (Page 404, Spambot, Dead URL)                               (Missing Salary, Unstated Exp, Remote, Discrepancies)
        │                                                             │
        ▼                                                             ▼
 eligibility_status:                                         eligibility_status:
 VERIFICATION_FAILED                                         REVIEW / KEEP
 rejection_reason:                                           review_reason:
 JD_NOT_FOUND, SOURCE_INVALID                                SALARY_UNKNOWN, EXPERIENCE_AMBIGUOUS,
                                                             LOCATION_REMOTE_REVIEW, SOURCE_CONFLICT_REVIEW
```

---

## 6. Deferred Capabilities
- **Automated Live Headless Browser Verification:** Automated pinging and DOM verification of application buttons are deferred to scraping implementation phases.
- **LLM-Based JD Consistency Checks:** Cross-checking deep semantic consistency between job titles and buried JD responsibilities using LLMs is deferred to Phase 6.
- **Company Registry Integrations:** Automatic API lookups against corporate registries (e.g., MCA/RoC databases) are deferred to later company enrichment milestones.
