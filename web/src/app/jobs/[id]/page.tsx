"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  Building03Icon,
  Location01Icon,
  CoinsDollarIcon,
  Calendar03Icon,
  Briefcase01Icon,
  SparklesIcon,
  Copy01Icon,
  Tick02Icon,
  Share01Icon,
  ArrowReloadHorizontalIcon,
  HelpCircleIcon,
  Shield01Icon,
  Home01Icon,
  Key01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "motion/react";
import { spring } from "@/lib/springs";
import { ThinkingIndicator } from "@/components/ui/thinking-indicator";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/motion/breadcrumb";
import { CompanyAvatar } from "@/components/company-avatar";
import { FluidActionButton } from "@/components/fluid-action-button";
import { PipelineStatusSelector, getStatusBadgeProps } from "@/components/motion/pipeline-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import { isValidCompanyWebsite } from "@/lib/urls";
import { SettingsDialog } from "@/components/dialog-sidebar/settings-dialog";
import { fontWeights } from "@/lib/font-weight";
import type { JobDetail, CopilotApplicationPack } from "@/lib/types";

function formatRoleVerdict(verdict?: string | null): string {
  if (!verdict) return "Under evaluation";
  if (verdict === "ELIGIBLE") return "Eligible";
  if (verdict === "REVIEW") return "Needs review";
  if (verdict === "NOT_RECOMMENDED") return "Not recommended";
  return verdict.charAt(0).toUpperCase() + verdict.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatExperienceFit(fit?: string | null): string {
  if (!fit) return "Early career (0–2 YOE)";
  if (fit === "ENTRY_LEVEL") return "Entry level (0–2 YOE)";
  if (fit === "FIT") return "Direct match";
  return fit.charAt(0).toUpperCase() + fit.slice(1).toLowerCase().replace(/_/g, " ");
}

function formatJobDescription(text?: string | null): string {
  if (!text) return "Job description details unavailable.";
  if (!text.includes("<") && !text.includes("&lt;")) return text;

  let cleaned = text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");

  cleaned = cleaned
    .replace(/<br\s*[\/]?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/(p|div|section|article)>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");

  return cleaned.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function JobDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F2F0] dark:bg-[#1B1F23] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
        <div className="h-64 rounded-xl bg-white dark:bg-[#24292E] border border-[#E0DFDC] dark:border-[#30363D] p-8 animate-pulse" />
        <div className="h-96 rounded-xl bg-white dark:bg-[#24292E] border border-[#E0DFDC] dark:border-[#30363D] p-8 animate-pulse" />
      </div>
    </div>
  );
}

function JobDetailInner() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [job, setJob] = React.useState<JobDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [appStatus, setAppStatus] = React.useState<string>("NOT_APPLIED");
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiData, setAiData] = React.useState<JobDetail["ai_analysis"]>(null);
  const [aiError, setAiError] = React.useState<string | null>(null);
  const [copilotPack, setCopilotPack] = React.useState<CopilotApplicationPack | null>(null);
  const [copilotError, setCopilotError] = React.useState<string | null>(null);
  const [isGeneratingPack, setIsGeneratingPack] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);

    fetch(`/api/jobs/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Job not found (${res.status})`);
        return res.json();
      })
      .then((data: JobDetail) => {
        if (!isMounted) return;
        setJob(data);
        setAppStatus(data.application_status || "NOT_APPLIED");
        if (data.ai_analysis) setAiData(data.ai_analysis);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Failed to load job posting");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!job || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    setAppStatus(newStatus);
    try {
      await fetch(`/api/jobs/${job.id}/application-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_status: newStatus }),
      });
    } catch {
      // rollback if failed
      setAppStatus(job.application_status || "NOT_APPLIED");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAnalyzeJob = async () => {
    if (!job || isAnalyzing) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) {
        setAiError(result.detail || result.error || "No active AI provider configured or available");
      } else {
        setAiData({
          id: result.input_hash,
          provider: result.provider,
          model: result.model,
          prompt_version: result.prompt_version,
          confidence: result.parsed?.confidence ?? 0.85,
          payload: result.parsed,
          from_cache: result.from_cache,
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(msg || "Failed to invoke AI analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateCopilotPack = async () => {
    if (!job || isGeneratingPack) return;
    setIsGeneratingPack(true);
    setCopilotError(null);
    try {
      const res = await fetch(`/api/jobs/${job.id}/copilot-pack`, { method: "POST" });
      const pack = await res.json();
      if (!res.ok) {
        setCopilotError(pack.detail || pack.error || "No active AI provider configured or available");
      } else {
        setCopilotPack(pack);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCopilotError(msg || "Failed to generate Copilot pack");
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] dark:bg-[#1B1F23] py-12 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
          <div className="h-64 rounded-xl bg-white dark:bg-[#24292E] border border-[#E0DFDC] dark:border-[#30363D] p-8 animate-pulse" />
          <div className="h-96 rounded-xl bg-white dark:bg-[#24292E] border border-[#E0DFDC] dark:border-[#30363D] p-8 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-[#F3F2F0] dark:bg-[#1B1F23] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive font-semibold text-lg">{error || "Job not found"}</div>
          <Button variant="secondary" onClick={() => router.push("/")}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} className="mr-2" />
            Back to Job Feed
          </Button>
        </div>
      </div>
    );
  }

  const compName = job.company?.name || job.company_name || "Company";
  const compWebsite = job.company?.website || (job as any)?.company_website;
  const hasValidWebsite = isValidCompanyWebsite(compWebsite, compName);
  const compIndustry = job.company?.sector || (job as any)?.company_sector || "Software & Technology";
  const rawModel = job.company?.business_model || (job as any)?.company_business_model || "PRODUCT";
  const compModel = rawModel === "SERVICES" ? "IT Services" : rawModel === "BOTH" ? "Hybrid Product / Services" : "Product Company";
  const isP1 = job.role_priority === "P1";
  const isP2 = job.role_priority === "P2";
  const isVerified = job.verification_confidence >= 0.9;

  const effectiveSalary = React.useMemo(() => {
    if (job?.salary?.text) return job.salary.text;
    if (job?.salary_text) return job.salary_text;
    if (job?.salary?.min && job?.salary?.max) {
      const cur = job.salary.currency === "INR" || !job.salary.currency ? "₹" : job.salary.currency === "USD" ? "$" : `${job.salary.currency} `;
      const minL = (job.salary.min / 100000).toFixed(0);
      const maxL = (job.salary.max / 100000).toFixed(0);
      return `${cur}${minL}L - ${cur}${maxL}L`;
    }
    if (job?.role_priority === "P1") return "₹10L - ₹18L (Est.)";
    if (job?.role_priority === "P2") return "₹8L - ₹16L (Est.)";
    if (job?.role_priority === "P3") return "₹6L - ₹14L (Est.)";
    return "₹8L - ₹15L (Est.)";
  }, [job]);

  return (
    <div className="min-h-screen bg-[#F3F2F0] dark:bg-[#1B1F23] text-[#191919] dark:text-[#F0F6FC]">
      <header className="sticky top-0 z-30 w-full bg-[#F3F2F0]/95 dark:bg-[#1B1F23]/95 backdrop-blur-md py-2 sm:py-3.5 px-2.5 sm:px-6">
        <div className="mx-auto flex h-12 sm:h-14 max-w-4xl items-center justify-between rounded-xl sm:rounded-2xl border border-[#E0DFDC] bg-white px-3 sm:px-6 shadow-xs dark:border-[#30363D] dark:bg-[#24292E] gap-2">
          {/* Mobile view (< sm): Compact back link and company tag */}
          <div className="flex sm:hidden items-center gap-2 min-w-0 flex-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0A66C2] dark:text-[#70B5F9] shrink-0 hover:underline"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
              <span>Jobs</span>
            </Link>
            <span className="text-zinc-300 dark:text-zinc-700">/</span>
            <Link
              href={`/?company=${encodeURIComponent(compName)}`}
              className="text-xs font-medium text-foreground truncate hover:text-[#0A66C2] transition-colors"
            >
              {compName}
            </Link>
          </div>

          {/* Desktop view (sm+): Full Breadcrumb with icon */}
          <div className="hidden sm:block min-w-0 overflow-hidden flex-1">
            <Breadcrumb>
              <BreadcrumbList maxItems={3}>
                <BreadcrumbItem>
                  <BreadcrumbLink render={(props) => <Link href="/" {...props} />}>
                    <HugeiconsIcon icon={Home01Icon} size={14} />
                    <span>Job Feed</span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbLink render={(props) => <Link href={`/?company=${encodeURIComponent(compName)}`} {...props} />}>
                    {compName}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbPage>{job.title}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <FluidActionButton
              icon={<HugeiconsIcon icon={Key01Icon} size={14} />}
              label="API settings"
              onClick={() => setIsSettingsOpen(true)}
            />
            <FluidActionButton
              icon={<HugeiconsIcon icon={Share01Icon} size={14} />}
              label="Share"
              activeLabel="Link Copied"
              isActive={copiedField === "share"}
              onClick={() => handleCopyText(window.location.href, "share")}
            />
          </div>
        </div>
      </header>

      {/* Main Reading & Application Workspace */}
      <main className="mx-auto max-w-4xl px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        {/* Hero Anchor Card */}
        <section className="rounded-xl border border-[#E0DFDC] bg-white p-4 sm:p-8 shadow-sm dark:border-[#30363D] dark:bg-[#24292E] space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <CompanyAvatar
                companyName={compName}
                applicationUrl={job.application_url}
                companyWebsite={hasValidWebsite ? compWebsite : undefined}
                size="lg"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-[#191919] dark:text-[#F0F6FC]">
                    {compName}
                  </h2>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#E6F4EA] dark:bg-[#057642]/20 px-2 py-0.5 text-[11px] font-semibold text-[#057642] dark:text-[#3FB950]" title="Direct ATS Verified Opportunity">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} strokeWidth={2.5} />
                      Verified Employer
                    </span>
                  )}
                  {hasValidWebsite && compWebsite && (
                    <a
                      href={compWebsite.startsWith("http") ? compWebsite : `https://${compWebsite}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-[#F3F2F0] hover:bg-[#E8F3FF] dark:bg-[#30363D] dark:hover:bg-[#1F6FEB]/20 px-2 py-0.5 text-xs font-medium text-[#0A66C2] dark:text-[#70B5F9] transition-colors"
                      title={`Visit ${compName} official website`}
                    >
                      <span>{compWebsite.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")}</span>
                      <ExternalLink className="size-3" />
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-[#666666] dark:text-[#8B949E]">
                  <span>{compIndustry}</span>
                  <span>•</span>
                  <span className="font-semibold text-[#191919] dark:text-[#F0F6FC]">{compModel}</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#191919] dark:text-[#F0F6FC] pt-1">
                  {job.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-[#666666] dark:text-[#8B949E]">
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Location01Icon} size={14} />
                    {job.location || "Remote / India"}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HugeiconsIcon icon={Briefcase01Icon} size={14} />
                    {job.experience?.text || job.experience_text || `${job.experience_min ?? 0}-${job.experience_max ?? 2} yrs`}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-[#057642] font-semibold dark:text-[#3FB950]">
                    <HugeiconsIcon icon={CoinsDollarIcon} size={14} />
                    {effectiveSalary}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-3 shrink-0">
              {job.application_url && (
                <Button
                  variant="primary"
                  size="default"
                  render={
                    <a
                      href={job.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  }
                  className="w-full sm:w-auto"
                >
                  Apply on Company ATS Portal
                </Button>
              )}
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <Badge color={getStatusBadgeProps(appStatus).color} size="compact">
                  {getStatusBadgeProps(appStatus).label}
                </Badge>
                {isP1 && (
                  <span className="rounded-full bg-[#E8F3FF] border border-[#0A66C2]/30 px-2.5 py-0.5 text-xs font-semibold text-[#0A66C2] dark:bg-[#70B5F9]/15 dark:text-[#70B5F9]">
                    Priority 1
                  </span>
                )}
                {isP2 && (
                  <span className="rounded-full bg-zinc-100 border border-zinc-300 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300">
                    Priority 2
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Personal Application Status Tracker */}
          <div className="border-t border-[#E0DFDC] pt-5 dark:border-[#30363D] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">
                Personal application pipeline
              </span>
            </div>
            <PipelineStatusSelector
              currentStatus={appStatus}
              onChange={handleUpdateStatus}
              disabled={isUpdatingStatus}
            />
          </div>
        </section>

        {/* Role & Company Overview Quick Specs Grid */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 rounded-xl border border-[#E0DFDC] bg-white p-4.5 sm:p-5 shadow-xs dark:border-[#30363D] dark:bg-[#24292E]">
          <div className="space-y-1">
            <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Offered Compensation</div>
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-bold text-[#057642] dark:text-[#3FB950]">
              <HugeiconsIcon icon={CoinsDollarIcon} size={16} className="shrink-0" />
              <span className="truncate">{effectiveSalary}</span>
            </div>
            <div className="text-[11px] text-[#888888] dark:text-[#7D8590]">
              {job.salary?.min ? "Annual Disclosed CTC" : "Market Benchmark Range"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Experience Level</div>
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-[#191919] dark:text-[#F0F6FC]">
              <HugeiconsIcon icon={Briefcase01Icon} size={16} className="text-[#666666] shrink-0" />
              <span className="truncate">{job.experience?.text || job.experience_text || `${job.experience_min ?? 0}-${job.experience_max ?? 2} yrs`}</span>
            </div>
            <div className="text-[11px] text-[#888888] dark:text-[#7D8590]">
              {isP1 ? "Early Career / GenAI Target" : "Standard Experience Band"}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Workplace Location</div>
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold text-[#191919] dark:text-[#F0F6FC]">
              <HugeiconsIcon icon={Location01Icon} size={16} className="text-[#0A66C2] shrink-0" />
              <span className="truncate">{job.location || "Remote / India"}</span>
            </div>
            <div className="text-[11px] text-[#888888] dark:text-[#7D8590]">
              {compModel}
            </div>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Employer Provenance</div>
            <div className="flex items-center gap-1.5 text-sm sm:text-base font-semibold">
              {isVerified ? (
                <span className="flex items-center gap-1.5 text-[#057642] dark:text-[#3FB950]">
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2.5} className="shrink-0" />
                  <span>Verified ({Math.round(job.verification_confidence * 100)}%)</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[#B24020]">
                  <HugeiconsIcon icon={AlertCircleIcon} size={16} strokeWidth={2} className="shrink-0" />
                  <span>Review ({Math.round(job.verification_confidence * 100)}%)</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#888888] dark:text-[#7D8590]">
              {compIndustry}
            </div>
          </div>
        </section>

        {/* High-Signal AI Intelligence & Skill Gap Evaluation */}
        <section className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-indigo-50/40 p-4 sm:p-6 dark:border-blue-900/40 dark:from-[#1F2633] dark:to-[#1B222E] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={SparklesIcon} size={18} className="text-[#0A66C2] dark:text-[#70B5F9] shrink-0" />
              <h3 className="text-base font-bold text-[#191919] dark:text-[#F0F6FC]">
                AI Intelligence & Skill Gap Analysis
              </h3>
            </div>
            {!aiData && !isAnalyzing && (
              <Button
                variant="secondary"
                size="compact"
                onClick={handleAnalyzeJob}
                className="text-xs self-start sm:self-auto shrink-0"
              >
                Run AI Intelligence
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
                transition={spring.moderate}
                className="py-3 px-4 rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-blue-200/60 dark:border-blue-900/40 shadow-xs"
              >
                <ThinkingIndicator
                  words={[
                    "Querying LLM Gateway",
                    "Parsing JD Tech Requirements",
                    "Evaluating Seniority Fit",
                    "Synthesizing Skill Gap Matrix",
                  ]}
                  size="compact"
                />
              </motion.div>
            )}

            {!isAnalyzing && aiError && (
              <motion.div
                key="ai-error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
                transition={spring.moderate}
                className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/30 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 shrink-0 mt-0.5">
                    <HugeiconsIcon icon={Key01Icon} size={18} />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h4
                      className="text-xs font-semibold text-rose-900 dark:text-rose-200"
                      style={{ fontVariationSettings: fontWeights.semibold }}
                    >
                      AI provider required
                    </h4>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-normal">
                      {aiError}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/80 dark:bg-zinc-900/70 p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40 mt-1">
                      <span className="text-[12px] text-zinc-600 dark:text-zinc-300 leading-normal">
                        Add your Google Gemini, Groq, OpenRouter, or local Ollama credentials in Profile → API, then toggle the provider on.
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-xs shrink-0 gap-1.5 font-medium cursor-pointer"
                      >
                        <HugeiconsIcon icon={Key01Icon} size={13} />
                        <span>Open API settings</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-0.5">
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={handleAnalyzeJob}
                    className="text-xs border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                  >
                    <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} className="mr-1.5" />
                    Retry analysis
                  </Button>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && !aiError && aiData?.payload && (
              <motion.div
                key="ai-payload"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
                transition={spring.moderate}
                className="space-y-4 text-xs"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-md font-semibold ${
                    aiData.payload.role_verdict === "ELIGIBLE"
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : aiData.payload.role_verdict === "REVIEW"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300"
                  }`}>
                    Verdict: {formatRoleVerdict(aiData.payload.role_verdict)}
                  </span>
                  <span className="text-muted-foreground">
                    Experience fit: <strong className="text-foreground">{formatExperienceFit(aiData.payload.experience_fit)}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Confidence: <strong className="text-foreground">{Math.round((aiData.payload.confidence ?? 0.85) * 100)}%</strong>
                  </span>
                  {aiData.from_cache && (
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      ⚡ Instant (ADR-009 SHA-256 Cache Hit)
                    </span>
                  )}
                </div>

                {aiData.payload.reasoning && (
                  <p className="text-zinc-600 dark:text-zinc-300 italic bg-white/70 dark:bg-zinc-900/50 p-3 rounded-lg border border-blue-100 dark:border-zinc-800">
                    &ldquo;{aiData.payload.reasoning}&rdquo;
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1.5">
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                      Matched core skills:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiData.payload.extracted_skills?.length ? (
                        aiData.payload.extracted_skills.map((sk: string) => (
                          <span key={sk} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground">None extracted</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <span className="font-semibold text-rose-700 dark:text-rose-400">
                      Identified skill gap:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {aiData.payload.missing_skills?.length ? (
                        aiData.payload.missing_skills.map((sk: string) => (
                          <span key={sk} className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
                            {sk}
                          </span>
                        ))
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">Zero skill gap identified</span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && !aiError && !aiData?.payload && (
              <motion.p
                key="ai-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground"
              >
                Click &ldquo;Run AI Intelligence&rdquo; to evaluate role compatibility, skill gaps, and early-career fit via live LLM inference.
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* Application Copilot Suite (Resume, Cover Note, Interview Prep) */}
        <section className="rounded-xl border border-purple-200 bg-purple-50/40 p-4 sm:p-6 dark:border-purple-900/40 dark:bg-[#252033]/40 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={SparklesIcon} size={18} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <h3 className="text-base font-bold text-[#191919] dark:text-[#F0F6FC]">
                Application Copilot Suite
              </h3>
            </div>
            {!isGeneratingPack && (
              <Button
                variant="secondary"
                size="compact"
                onClick={handleGenerateCopilotPack}
                className="text-xs self-start sm:self-auto shrink-0"
              >
                {copilotPack ? "Regenerate Pack" : "Generate Copilot Pack"}
              </Button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {isGeneratingPack && (
              <motion.div
                key="generating"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
                transition={spring.moderate}
                className="py-3 px-4 rounded-xl bg-white/80 dark:bg-zinc-900/60 border border-purple-200/60 dark:border-purple-900/40 shadow-xs"
              >
                <ThinkingIndicator
                  words={[
                    "Querying Copilot LLM",
                    "Synthesizing Tailored Resume Bullets",
                    "Composing Recruiter Outreach Note",
                    "Generating Technical Interview Talking Points",
                  ]}
                  size="compact"
                />
              </motion.div>
            )}

            {!isGeneratingPack && copilotError && (
              <motion.div
                key="copilot-error"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
                transition={spring.moderate}
                className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/50 dark:bg-rose-950/30 space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300 shrink-0 mt-0.5">
                    <HugeiconsIcon icon={Key01Icon} size={18} />
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <h4
                      className="text-xs font-semibold text-rose-900 dark:text-rose-200"
                      style={{ fontVariationSettings: fontWeights.semibold }}
                    >
                      AI provider required
                    </h4>
                    <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-normal">
                      {copilotError}
                    </p>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/80 dark:bg-zinc-900/70 p-3 rounded-lg border border-rose-200/60 dark:border-rose-900/40 mt-1">
                      <span className="text-[12px] text-zinc-600 dark:text-zinc-300 leading-normal">
                        Add your Google Gemini, Groq, OpenRouter, or local Ollama credentials in Profile → API, then toggle the provider on.
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        size="compact"
                        onClick={() => setIsSettingsOpen(true)}
                        className="text-xs shrink-0 gap-1.5 font-medium cursor-pointer"
                      >
                        <HugeiconsIcon icon={Key01Icon} size={13} />
                        <span>Open API settings</span>
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end pt-0.5">
                  <Button
                    variant="secondary"
                    size="compact"
                    onClick={handleGenerateCopilotPack}
                    className="text-xs border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 cursor-pointer"
                  >
                    <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={13} className="mr-1.5" />
                    Retry copilot generation
                  </Button>
                </div>
              </motion.div>
            )}

            {!isGeneratingPack && !copilotError && copilotPack && (
              <motion.div
                key="copilot-pack"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: spring.moderate.exit }}
                transition={spring.moderate}
                className="space-y-5 pt-1 text-xs"
              >
                {/* Tailored Bullets */}
                <div className="space-y-2 bg-white dark:bg-zinc-900/70 p-4 rounded-xl border border-purple-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Tailored resume bullet points (Action + Tech + Impact):
                    </span>
                    <FluidActionButton
                      icon={<HugeiconsIcon icon={Copy01Icon} size={13} />}
                      label="Copy All"
                      activeLabel="Copied"
                      isActive={copiedField === "bullets"}
                      onClick={() => handleCopyText(copilotPack.tailored_bullets.join("\n"), "bullets")}
                    />
                  </div>
                  <ul className="space-y-1.5 text-zinc-700 dark:text-zinc-300">
                    {copilotPack.tailored_bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cover Note */}
                <div className="space-y-2 bg-white dark:bg-zinc-900/70 p-4 rounded-xl border border-purple-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      Outreach cover note (120–150 words):
                    </span>
                    <FluidActionButton
                      icon={<HugeiconsIcon icon={Copy01Icon} size={13} />}
                      label="Copy Note"
                      activeLabel="Copied"
                      isActive={copiedField === "cover"}
                      onClick={() => handleCopyText(copilotPack.cover_note, "cover")}
                    />
                  </div>
                  <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                    {copilotPack.cover_note}
                  </p>
                </div>

                {/* Interview Q&A */}
                <div className="space-y-2 bg-white dark:bg-zinc-900/70 p-4 rounded-xl border border-purple-100 dark:border-zinc-800">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    Targeted interview prep questions & model talking points:
                  </span>
                  <div className="space-y-2.5 pt-1">
                    {copilotPack.interview_qa.map((qa, i) => (
                      <div key={i} className="rounded-lg bg-zinc-50 dark:bg-zinc-800/60 p-3 space-y-1">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-start gap-1.5">
                          <span className="text-purple-600 dark:text-purple-400">Q{i + 1}:</span>
                          <span>{qa.question}</span>
                        </div>
                        <div className="text-muted-foreground pl-5 text-[11.5px]">
                          <strong className="text-foreground">Model talking points:</strong> {qa.talking_points}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {!isGeneratingPack && !copilotError && !copilotPack && (
              <motion.p
                key="copilot-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground"
              >
                Synthesize 3 customized resume bullet points, an elevator outreach pitch, and 3 role-specific technical interview questions via live LLM inference.
              </motion.p>
            )}
          </AnimatePresence>
        </section>

        {/* Clean Job Description (720px optimal reading measure) */}
        <section className="rounded-xl border border-[#E0DFDC] bg-white p-6 sm:p-8 shadow-sm dark:border-[#30363D] dark:bg-[#24292E] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E0DFDC] pb-4 dark:border-[#30363D]">
            <HugeiconsIcon icon={Briefcase01Icon} size={18} className="text-[#0A66C2] dark:text-[#70B5F9]" />
            <h3 className="text-base font-bold text-[#191919] dark:text-[#F0F6FC]">
              Job description & sourcing criteria
            </h3>
          </div>

          <article className="prose prose-zinc dark:prose-invert max-w-[740px] text-[14px] leading-relaxed text-[#191919] dark:text-[#F0F6FC] whitespace-pre-line font-sans">
            {formatJobDescription(job.description || job.description_clean || job.description_raw)}
          </article>
        </section>

        {/* Verification & Source Provenance Audit */}
        {job.source_references && job.source_references.length > 0 && (
          <section className="rounded-xl border border-[#E0DFDC] bg-white p-6 shadow-sm dark:border-[#30363D] dark:bg-[#24292E] space-y-3">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Shield01Icon} size={16} className="text-[#057642]" />
              <h4 className="text-xs font-semibold text-[#666666] dark:text-[#8B949E]">
                Ingestion provenance & multi-source audit
              </h4>
            </div>
            <div className="space-y-2 text-xs">
              {job.source_references.map((ref) => (
                <div key={ref.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 p-2.5 dark:bg-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{ref.source_id}</span>
                    <span className="text-muted-foreground">• ID: {ref.source_job_id}</span>
                  </div>
                  {ref.source_url && (
                    <a
                      href={ref.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline text-[11px]"
                    >
                      View Source Posting ↗
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Settings / API Modal */}
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        defaultSection="api"
      />
    </div>
  );
}

export default function JobDetailPage() {
  return (
    <React.Suspense fallback={<JobDetailSkeleton />}>
      <JobDetailInner />
    </React.Suspense>
  );
}
