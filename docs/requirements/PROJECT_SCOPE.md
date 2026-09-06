# Project Scope: AI Job Intelligence

> **Status:** Approved Baseline  
> **Phase:** Phase 0 (Planning & Requirements)

---

## Overview
This document defines the baseline functional scope and core requirements for the **AI Job Intelligence** project. These requirements reflect the agreed-upon criteria and boundaries established during initial project discovery.

---

## Known Requirements

### 1. Job Ingestion & Discovery
- **Centralized Job Discovery:** Aggregation of job openings into a single, unified discovery system.
- **Maximum Possible Job Coverage:** Broad reach to capture relevant openings across the target job landscape.
- **Multiple Job Sources:** Ingestion capabilities spanning multiple distinct sources rather than relying on a single channel.

### 2. Data Quality & Normalization
- **Deduplication:** Robust detection and removal of redundant job postings originating across identical or differing sources.
- **Actual JD Verification:** Verification of the actual job description (JD) to validate listing authenticity and completeness.

### 3. Rule-Based Filtering
- **Role Filtering:** Evaluation and filtering based on user-specified target roles and titles.
- **Experience Filtering:** Precision filtering according to candidate experience levels and years-of-experience criteria.
- **Location Filtering:** Location-based filtering accommodating geographic preferences, remote, hybrid, or on-site arrangements.
- **Salary Filtering:** Filtering by stated or verified compensation bands.
- **Job Freshness Filtering:** Filtering postings based on publication age and posting recency.

### 4. Company Intelligence
- **Company Verification:** Verification of company legitimacy and identity details.
- **Company Classification:** Structural categorization of hiring companies, including:
  - IT vs. Non-IT
  - Product-based vs. Service-based

### 5. AI & Enrichment
- **AI/LLM Enrichment Later:** Integration of AI/LLM capabilities in later phases to enrich, summarize, and extract structured insights from job data.

### 6. Operational Boundaries & Human Oversight
- **No Automatic Job Application in V1:** The system will strictly not perform automated job applications or automated submissions in V1.
- **Human Review Before Any Future Application Functionality:** Any prospective future application workflows must mandate explicit human review and authorization prior to any action.
