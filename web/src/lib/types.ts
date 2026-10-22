export type RolePriority = "P1" | "P2" | "P3" | "NOT_RELEVANT";
export type JobStatus = "ELIGIBLE" | "REVIEW" | "REJECTED" | "EXPIRED" | "APPLIED";

export interface JobSourceReference {
  id: string;
  source_id: string;
  source_job_id: string;
  source_url: string;
  source_data?: Record<string, unknown>;
  created_at?: string;
}

export interface VerificationRecord {
  id: string;
  status?: string;
  confidence: number;
  source_valid?: boolean;
  jd_exists?: boolean;
  evidence?: string | null;
  method?: string;
  verified_at?: string;
}

export interface FilterDecision {
  id: string;
  status?: string;
  role_priority?: string;
  reason_codes?: string[];
  decision_details?: string | null;
  stage?: string;
  passed?: boolean;
  evaluated_at?: string;
}

export interface JobItem {
  id: string;
  company_name: string;
  title: string;
  normalized_title?: string;
  role_priority: RolePriority;
  location: string;
  location_type?: string;
  experience_min?: number | null;
  experience_max?: number | null;
  experience_text?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: string | null;
  salary_text?: string | null;
  status: JobStatus;
  rejection_reason?: string | null;
  review_reason?: string | null;
  verification_confidence: number;
  posted_at?: string | null;
  application_url?: string | null;
  application_status?: string | null;
  sources_count: number;
  company_website?: string | null;
  company_sector?: string | null;
  company_business_model?: string | null;
  description?: string | null;
  description_clean?: string | null;
  source_references?: JobSourceReference[];
  verification_records?: VerificationRecord[];
  filter_decisions?: FilterDecision[];
}

export interface AIAnalysisPayload {
  role_verdict: "ELIGIBLE" | "REVIEW" | "REJECTED";
  target_role: string;
  experience_fit: string;
  extracted_skills: string[];
  missing_skills: string[];
  key_responsibilities: string[];
  confidence: number;
  reasoning: string;
}

export interface AIAnalysisData {
  id?: string;
  provider: string;
  model: string;
  prompt_version?: string;
  confidence: number;
  tokens_used?: number | null;
  created_at?: string;
  payload: AIAnalysisPayload;
  from_cache?: boolean;
}

export interface JobDetail extends JobItem {
  description?: string | null;
  description_raw?: string | null;
  company?: {
    id: string;
    name: string;
    website?: string | null;
    sector?: string | null;
    business_model?: string | null;
    is_agency?: boolean;
  };
  salary?: {
    min?: number | null;
    max?: number | null;
    currency?: string | null;
    period?: string | null;
    text?: string | null;
  } | null;
  experience?: {
    min?: number | null;
    max?: number | null;
    text?: string | null;
  } | null;
  ai_analysis?: AIAnalysisData | null;
}

export interface JobListResponse {
  total: number;
  limit: number;
  offset: number;
  jobs: JobItem[];
}

export interface CollectionRunItem {
  id: string;
  source_id: string;
  started_at?: string | null;
  finished_at?: string | null;
  status: string;
  jobs_found: number;
  jobs_created: number;
  jobs_updated: number;
  jobs_failed: number;
  error_summary?: string | null;
}

export interface RunsResponse {
  runs: CollectionRunItem[];
}

export interface InterviewQuestion {
  question: string;
  talking_points: string;
}

export interface CopilotApplicationPack {
  tailored_bullets: string[];
  cover_note: string;
  interview_qa: InterviewQuestion[];
}
