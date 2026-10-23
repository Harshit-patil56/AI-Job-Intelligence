"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Location01Icon,
  CoinsDollarIcon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Link01Icon,
  Shield01Icon,
  Layers01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CompanyAvatar } from "@/components/company-avatar";
import { JobItem, JobDetail, CopilotApplicationPack } from "@/lib/types";
import { FluidActionButton } from "@/components/fluid-action-button";
import { Badge } from "@/components/ui/badge";
import { PipelineStatusSelector, getStatusBadgeProps } from "@/components/motion/pipeline-status";
import { Sparkles, RefreshCw, Copy, Check, FileText, Send, HelpCircle, CheckCircle2, ExternalLink } from "lucide-react";
import { isValidCompanyWebsite } from "@/lib/urls";

interface JobDetailDialogProps {
  job: JobItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
}: JobDetailDialogProps) {
  const [detail, setDetail] = React.useState<JobDetail | null>(null);
  const [logoError, setLogoError] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [aiData, setAiData] = React.useState<JobDetail["ai_analysis"]>(null);
  const [appStatus, setAppStatus] = React.useState<string>("NOT_APPLIED");
  const [copilotPack, setCopilotPack] = React.useState<CopilotApplicationPack | null>(null);
  const [isGeneratingPack, setIsGeneratingPack] = React.useState(false);
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!job || !open) {
      setDetail(null);
      setLogoError(false);
      setAiData(null);
      setCopilotPack(null);
      setAppStatus("NOT_APPLIED");
      return;
    }

    setAppStatus(job.application_status || "NOT_APPLIED");
    let isMounted = true;

    fetch(`/api/jobs/${job.id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load details");
        return res.json();
      })
      .then((data: JobDetail) => {
        if (isMounted) {
          setDetail(data);
          setAiData(data.ai_analysis || null);
          setAppStatus(data.application_status || "NOT_APPLIED");
        }
      })
      .catch(() => {
        if (isMounted) {
          setDetail(job as JobDetail);
          setAiData(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [job, open]);

  const handleTriggerAnalysis = async (force = false) => {
    if (!job?.id) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/analyze?force_refresh=${force}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("AI analysis request failed");
      const data = await res.json();
      setAiData({
        provider: data.provider,
        model: data.model,
        prompt_version: data.prompt_version,
        confidence: data.parsed.confidence,
        tokens_used: data.tokens_used,
        payload: data.parsed,
        from_cache: data.from_cache,
      });
    } catch (err) {
      console.error("AI Analysis error:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!job?.id) return;
    setAppStatus(newStatus);
    try {
      await fetch(`/api/jobs/${job.id}/application-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleGenerateCopilotPack = async () => {
    if (!job?.id) return;
    setIsGeneratingPack(true);
    try {
      const res = await fetch(`/api/jobs/${job.id}/copilot-pack`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to generate pack");
      const data = await res.json();
      setCopilotPack(data);
    } catch (err) {
      console.error("Failed to generate pack:", err);
    } finally {
      setIsGeneratingPack(false);
    }
  };

  const handleCopyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!job) return null;

  const current = detail || (job as JobDetail);
  const isP1 = current.role_priority === "P1";
  const isP2 = current.role_priority === "P2";
  const isVerified = current.verification_confidence >= 0.9;
  const compName = current.company?.name || current.company_name || "Company";
  const compWebsite = detail?.company?.website || (current as any)?.company_website;
  const hasValidWebsite = isValidCompanyWebsite(compWebsite, compName);
  const compIndustry = detail?.company?.sector || (current as any)?.company_sector || "Software & Technology";
  const rawModel = detail?.company?.business_model || (current as any)?.company_business_model || "PRODUCT";
  const compModel = rawModel === "SERVICES" ? "IT Services" : rawModel === "BOTH" ? "Hybrid Product / Services" : "Product Company";

  const effectiveSalary = React.useMemo(() => {
    if (detail?.salary?.text) return detail.salary.text;
    if (detail?.salary_text) return detail.salary_text;
    if (current?.salary_text) return current.salary_text;
    if (detail?.salary?.min && detail?.salary?.max) {
      const cur = detail.salary.currency === "INR" || !detail.salary.currency ? "₹" : detail.salary.currency === "USD" ? "$" : `${detail.salary.currency} `;
      const minL = (detail.salary.min / 100000).toFixed(0);
      const maxL = (detail.salary.max / 100000).toFixed(0);
      return `${cur}${minL}L - ${cur}${maxL}L`;
    }
    if (current?.role_priority === "P1") return "₹10L - ₹18L (Est.)";
    if (current?.role_priority === "P2") return "₹8L - ₹16L (Est.)";
    if (current?.role_priority === "P3") return "₹6L - ₹14L (Est.)";
    return "₹8L - ₹15L (Est.)";
  }, [detail, current]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        size="xl"
        className="bg-white dark:bg-[#24292E] border border-[#E0DFDC] max-h-[88vh] h-[85vh] flex flex-col p-0 overflow-hidden rounded-xl sm:rounded-2xl"
      >
        {/* Fixed Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E0DFDC] px-5 py-4 sm:px-8 sm:py-5 dark:border-[#30363D] shrink-0 bg-white dark:bg-[#24292E] pr-12 sm:pr-14">
          <div className="flex items-center gap-3.5">
            {/* Real Company Avatar with 4-Tier Free-First Cascade */}
            <CompanyAvatar
              companyName={compName}
              applicationUrl={current.application_url}
              companyWebsite={hasValidWebsite ? compWebsite : undefined}
              size="lg"
            />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-[#191919] dark:text-[#F0F6FC]">
                  {compName}
                </span>
                {isVerified && (
                  <span className="flex items-center text-[#057642]" title="Direct ATS Verified">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} strokeWidth={2.5} />
                  </span>
                )}
                {hasValidWebsite && compWebsite && (
                  <a
                    href={compWebsite.startsWith("http") ? compWebsite : `https://${compWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-[#F3F2F0] hover:bg-[#E8F3FF] dark:bg-[#30363D] dark:hover:bg-[#1F6FEB]/20 px-2 py-0.5 text-[11px] font-medium text-[#0A66C2] dark:text-[#70B5F9] transition-colors"
                    title={`Visit ${compName} official website`}
                  >
                    <span>{compWebsite.replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "")}</span>
                    <ExternalLink className="size-2.5" />
                  </a>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666] dark:text-[#8B949E] mt-0.5">
                <span>{compIndustry}</span>
                <span>•</span>
                <span className="font-medium text-[#191919] dark:text-[#F0F6FC]">{compModel}</span>
                <span>•</span>
                <span className="font-semibold text-[#057642] dark:text-[#3FB950] flex items-center gap-1">
                  <HugeiconsIcon icon={CoinsDollarIcon} size={13} />
                  {effectiveSalary}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isP1 && (
              <span className="rounded-full bg-[#E8F3FF] border border-[#0A66C2]/30 px-3 py-1 text-xs font-semibold text-[#0A66C2]">
                P1 • GenAI
              </span>
            )}
            {isP2 && (
              <span className="rounded-full bg-[#F0F4F8] border border-[#004182]/20 px-3 py-1 text-xs font-medium text-[#004182] dark:text-[#70B5F9]">
                P2 • Backend
              </span>
            )}
            <span className="rounded-full bg-[#F3F2F0] px-3 py-1 text-xs font-medium text-[#666666] dark:bg-[#30363D] dark:text-[#8B949E]">
              Status: {current.status}
            </span>
            <Link
              href={`/jobs/${current.id}`}
              className="inline-flex items-center gap-1 rounded-md border border-[#E0DFDC] bg-white px-2.5 py-1 text-xs font-semibold text-[#0A66C2] hover:bg-[#E8F3FF] dark:border-[#30363D] dark:bg-[#1F2428] dark:text-[#70B5F9] dark:hover:bg-[#30363D] transition-colors"
              title="Open dedicated reading page in new tab"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-3" />
              Full Page
            </Link>
          </div>
        </div>

        {/* Scrollable Middle Content with Generous Margins */}
        <ScrollArea
          className="flex-1 min-h-0 overflow-hidden"
          viewportClassName="scroll-fade"
        >
          <div className="px-4 py-5 sm:px-8 sm:py-7 space-y-5 sm:space-y-7">
          {/* Title & Overview */}
          <div className="space-y-2 pb-1">
            <DialogTitle className="text-2xl font-bold tracking-tight text-[#191919] dark:text-[#F0F6FC]">
              {current.title}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-[#666666] dark:text-[#8B949E] leading-normal">
              Deduplicated canonical posting with multi-source audit trail and agency heuristics evaluation.
            </DialogDescription>
          </div>

          {/* Quick specs grid with Compensation Tile */}
          <div className="grid grid-cols-2 gap-3.5 sm:gap-4 rounded-xl border border-[#E0DFDC] bg-[#F3F2F0]/50 p-4.5 sm:grid-cols-3 lg:grid-cols-5 dark:border-[#30363D] dark:bg-[#1F2428]">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Offered Compensation</div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-[#057642] dark:text-[#3FB950]">
                <HugeiconsIcon icon={CoinsDollarIcon} size={15} className="shrink-0" />
                <span className="truncate">{effectiveSalary}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Location</div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#191919] dark:text-[#F0F6FC]">
                <HugeiconsIcon icon={Location01Icon} size={15} className="text-[#0A66C2] shrink-0" />
                <span className="truncate">{current.location || "India"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Experience</div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#191919] dark:text-[#F0F6FC]">
                <HugeiconsIcon icon={Briefcase01Icon} size={15} className="text-[#666666] shrink-0" />
                <span className="truncate">{current.experience_text || "Not specified"}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Verification</div>
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                {isVerified ? (
                  <span className="flex items-center gap-1.5 text-[#057642]">
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} strokeWidth={2.5} className="shrink-0" />
                    <span>Direct ({Math.round(current.verification_confidence * 100)}%)</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#B24020]">
                    <HugeiconsIcon icon={AlertCircleIcon} size={15} strokeWidth={2} className="shrink-0" />
                    <span>Review ({Math.round(current.verification_confidence * 100)}%)</span>
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-medium text-[#666666] dark:text-[#8B949E]">Sources linked</div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-[#0A66C2]">
                <HugeiconsIcon icon={Layers01Icon} size={15} className="shrink-0" />
                <span>{current.sources_count || 1} ATS Ingestion</span>
              </div>
            </div>
          </div>

          {/* Employer Profile & Corporate Intelligence Card */}
          <div className="rounded-xl border border-[#E0DFDC] bg-white p-4.5 shadow-2xs dark:border-[#30363D] dark:bg-[#24292E] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CompanyAvatar
                  companyName={compName}
                  applicationUrl={current.application_url}
                  companyWebsite={hasValidWebsite ? compWebsite : undefined}
                  size="md"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-[#191919] dark:text-[#F0F6FC]">
                      {compName}
                    </h4>
                    {isVerified && (
                      <span className="inline-flex items-center gap-1 rounded bg-[#E6F4EA] dark:bg-[#057642]/20 px-2 py-0.5 text-[11px] font-semibold text-[#057642] dark:text-[#3FB950]">
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} strokeWidth={2.5} />
                        Verified Employer
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666] dark:text-[#8B949E] mt-0.5">
                    <span>{compIndustry}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#191919] dark:text-[#F0F6FC]">{compModel}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#057642] dark:text-[#3FB950] flex items-center gap-1">
                      <HugeiconsIcon icon={CoinsDollarIcon} size={13} />
                      {effectiveSalary}
                    </span>
                  </div>
                </div>
              </div>

              {hasValidWebsite && compWebsite && (
                <a
                  href={compWebsite.startsWith("http") ? compWebsite : `https://${compWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[#E0DFDC] bg-[#F3F2F0]/80 hover:bg-[#E8F3FF] px-3 py-1.5 text-xs font-semibold text-[#0A66C2] dark:border-[#30363D] dark:bg-[#1F2428] dark:text-[#70B5F9] dark:hover:bg-[#30363D] transition-colors"
                >
                  <span>Company Website</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>

          {/* AI Intelligence & Fit Assessment Card (ADR-007 Gateway & Skill Gap) */}
          <div className="rounded-xl border border-[#0A66C2]/30 bg-gradient-to-br from-[#F4F9FD] to-white p-5 shadow-xs dark:border-[#1F6FEB]/40 dark:from-[#1C2128] dark:to-[#24292E] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0A66C2]/10 text-[#0A66C2] dark:bg-[#1F6FEB]/20 dark:text-[#58A6FF]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#191919] dark:text-[#F0F6FC]">
                    AI Intelligence & Skill Gap Analysis
                  </h4>
                  <p className="text-[11px] text-[#666666] dark:text-[#8B949E]">
                    Multi-Provider LLM Gateway (Gemini / Groq / Ollama) • SHA-256 Cached
                  </p>
                </div>
              </div>

              {aiData && (
                <Button
                  variant="secondary"
                  size="compact"
                  disabled={isAnalyzing}
                  onClick={() => handleTriggerAnalysis(true)}
                  className="h-7 text-xs gap-1 border-[#0A66C2]/30 text-[#0A66C2] hover:bg-[#0A66C2]/10"
                >
                  <RefreshCw className={`h-3 w-3 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>Re-Evaluate</span>
                </Button>
              )}
            </div>

            {aiData ? (
              <div className="space-y-3.5">
                {/* Verdict & Role metadata */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      aiData.payload.role_verdict === "ELIGIBLE"
                        ? "bg-[#E6F4EA] text-[#137333] border border-[#137333]/30"
                        : aiData.payload.role_verdict === "REVIEW"
                        ? "bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/30"
                        : "bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/30"
                    }`}
                  >
                    Verdict: {aiData.payload.role_verdict === "ELIGIBLE" ? "Eligible" : aiData.payload.role_verdict === "REVIEW" ? "Needs review" : "Not recommended"}
                  </span>

                  <span className="inline-flex items-center rounded-full bg-[#E8F3FF] border border-[#0A66C2]/30 px-2.5 py-0.5 text-xs font-semibold text-[#0A66C2]">
                    Role: {aiData.payload.target_role}
                  </span>

                  <span className="text-[11.5px] text-[#666666] dark:text-[#8B949E]">
                    • Experience: <strong className="text-foreground">{aiData.payload.experience_fit}</strong>
                  </span>

                  <span className="ml-auto text-[11px] font-mono text-[#666666] dark:text-[#8B949E]">
                    {aiData.provider} ({aiData.model}) {aiData.from_cache ? "• ⚡ Cached" : "• Live"}
                  </span>
                </div>

                {/* Reasoning */}
                <div className="rounded-lg bg-white/80 dark:bg-[#161B22] p-3 text-xs leading-relaxed text-[#191919] dark:text-[#F0F6FC] border border-[#E0DFDC]/80 dark:border-[#30363D]">
                  <span className="font-semibold text-[#0A66C2]">AI evaluation reasoning: </span>
                  {aiData.payload.reasoning}
                </div>

                {/* Extracted vs Missing Skills Grid */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-white/70 dark:bg-[#161B22]/70 p-3 border border-[#E0DFDC]/70 dark:border-[#30363D]">
                    <div className="text-xs font-semibold text-[#0A66C2] dark:text-[#70B5F9] mb-1.5 flex items-center justify-between">
                      <span>Required tech stack</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({aiData.payload.extracted_skills.length})</span>
                    </div>
                    {aiData.payload.extracted_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {aiData.payload.extracted_skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-[#E8F3FF] border border-[#0A66C2]/20 px-2 py-0.5 text-[11px] font-medium text-[#0A66C2]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-muted-foreground italic">No specific languages or frameworks listed.</p>
                    )}
                  </div>

                  <div className="rounded-lg bg-white/70 dark:bg-[#161B22]/70 p-3 border border-[#E0DFDC]/70 dark:border-[#30363D]">
                    <div className="text-xs font-semibold text-[#B06000] dark:text-amber-400 mb-1.5 flex items-center justify-between">
                      <span>Skill preparation gap</span>
                      <span className="font-mono text-[10px] text-muted-foreground">({aiData.payload.missing_skills.length})</span>
                    </div>
                    {aiData.payload.missing_skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {aiData.payload.missing_skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-md bg-[#FEF7E0] border border-[#B06000]/20 px-2 py-0.5 text-[11px] font-medium text-[#B06000]"
                            title="Non-blocking gap: Learn this to maximize interview performance"
                          >
                            + {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11.5px] text-[#137333] font-medium">Full skill match for early-career profile.</p>
                    )}
                  </div>
                </div>

                {/* Key Responsibilities */}
                {aiData.payload.key_responsibilities && aiData.payload.key_responsibilities.length > 0 && (
                  <div className="rounded-lg bg-white/50 dark:bg-[#161B22]/50 p-2.5 border border-[#E0DFDC]/60 dark:border-[#30363D]/60 text-xs">
                    <span className="font-semibold text-xs text-[#666666] dark:text-[#8B949E] block mb-1">
                      Synthesized core responsibilities:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-[12px] text-[#333333] dark:text-[#C9D1D9]">
                      {aiData.payload.key_responsibilities.map((resp, idx) => (
                        <li key={idx}>{resp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white/70 dark:bg-[#161B22]/70 p-4 border border-[#E0DFDC]/80 dark:border-[#30363D]">
                <div>
                  <p className="text-xs font-medium text-[#191919] dark:text-[#F0F6FC]">
                    No AI evaluation generated yet for this job listing.
                  </p>
                  <p className="text-[11.5px] text-[#666666] dark:text-[#8B949E] mt-0.5">
                    Evaluate 0–2 YOE fit, extract required stack, and identify skill gaps using the LLM Gateway.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="compact"
                  disabled={isAnalyzing}
                  onClick={() => handleTriggerAnalysis(false)}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <Sparkles className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
                  <span>{isAnalyzing ? "Evaluating with AI..." : "Run AI Analysis"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Application Tracking & Copilot Asset Pack Card (Item 2: Copilot) */}
          <div className="rounded-xl border border-[#E0DFDC] bg-white p-5 shadow-xs dark:border-[#30363D] dark:bg-[#24292E] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#191919] dark:text-[#F0F6FC]">
                <FileText className="h-4 w-4 text-[#0A66C2]" />
                <span>Application tracker & tailored copilot</span>
                <Badge color={getStatusBadgeProps(appStatus).color} size="compact">
                  {getStatusBadgeProps(appStatus).label}
                </Badge>
              </div>

              {/* Status Tracking Pipeline Selector */}
              <PipelineStatusSelector
                currentStatus={appStatus}
                onChange={handleUpdateStatus}
              />
            </div>

            {/* Copilot Pack Generator / Display */}
            {copilotPack ? (
              <div className="space-y-4 pt-1">
                {/* 1. Tailored Bullets */}
                <div className="rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] p-3.5 dark:border-[#30363D] dark:bg-[#1F2428] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A66C2]">
                    <span>Tailored Resume Talking Points</span>
                    <span className="text-[10px] text-muted-foreground">Action Verb + Impact</span>
                  </div>
                  <div className="space-y-2">
                    {copilotPack.tailored_bullets.map((bullet, idx) => (
                      <div
                        key={idx}
                        className="group flex items-start justify-between gap-2 rounded-md bg-white p-2.5 text-xs text-[#191919] dark:bg-[#161B22] dark:text-[#F0F6FC] border border-[#E0DFDC]/80 dark:border-[#30363D]"
                      >
                        <span className="leading-relaxed">• {bullet}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyText(bullet, `bullet-${idx}`)}
                          className="shrink-0 p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Copy bullet"
                        >
                          {copiedField === `bullet-${idx}` ? (
                            <Check className="h-3.5 w-3.5 text-[#137333]" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Cover / Outreach Note */}
                <div className="rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] p-3.5 dark:border-[#30363D] dark:bg-[#1F2428] space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#0A66C2]">
                    <span>Targeted Recruiter / Cover Outreach Note</span>
                    <FluidActionButton
                      icon={<Copy className="size-3" />}
                      label="Copy Full Note"
                      activeLabel="Copied!"
                      isActive={copiedField === "cover_note"}
                      onClick={() => handleCopyText(copilotPack.cover_note, "cover_note")}
                    />
                  </div>
                  <div className="rounded-md bg-white p-3 text-xs leading-relaxed text-[#191919] dark:bg-[#161B22] dark:text-[#F0F6FC] border border-[#E0DFDC]/80 dark:border-[#30363D] whitespace-pre-line">
                    {copilotPack.cover_note}
                  </div>
                </div>

                {/* 3. Interview Q&A Talking Points */}
                {copilotPack.interview_qa && copilotPack.interview_qa.length > 0 && (
                  <div className="rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] p-3.5 dark:border-[#30363D] dark:bg-[#1F2428] space-y-2.5">
                    <div className="text-xs font-bold text-[#0A66C2]">
                      Technical & Screening Interview Prep (3 Anticipated Q&A)
                    </div>
                    <div className="space-y-2">
                      {copilotPack.interview_qa.map((qa, idx) => (
                        <div
                          key={idx}
                          className="rounded-md bg-white p-2.5 text-xs text-[#191919] dark:bg-[#161B22] dark:text-[#F0F6FC] border border-[#E0DFDC]/80 dark:border-[#30363D] space-y-1"
                        >
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span className="text-[#0A66C2]">Q{idx + 1}:</span> {qa.question}
                          </div>
                          <div className="text-[11.5px] text-muted-foreground leading-relaxed pl-5">
                            <strong className="text-[#666666] dark:text-[#8B949E]">Model Talking Points: </strong>
                            {qa.talking_points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E0DFDC]/80 bg-[#F8F9FA] p-3.5 dark:border-[#30363D] dark:bg-[#1F2428]">
                <div>
                  <p className="text-xs font-semibold text-[#191919] dark:text-[#F0F6FC]">
                    Generate Tailored Application Pack
                  </p>
                  <p className="text-[11.5px] text-[#666666] dark:text-[#8B949E] mt-0.5">
                    Synthesizes customized resume bullet points, targeted recruiter outreach message, and 3 interview screening Q&As.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="compact"
                  disabled={isGeneratingPack}
                  onClick={handleGenerateCopilotPack}
                  className="gap-1.5 text-xs shrink-0"
                >
                  <Send className={`h-3.5 w-3.5 ${isGeneratingPack ? "animate-spin" : ""}`} />
                  <span>{isGeneratingPack ? "Synthesizing Pack..." : "Generate Application Pack"}</span>
                </Button>
              </div>
            )}
          </div>

          {/* Deduplication & Audit Section */}
          <div className="rounded-xl border border-[#E0DFDC] bg-white p-5 shadow-xs dark:border-[#30363D] dark:bg-[#24292E] space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#191919] dark:text-[#F0F6FC]">
              <HugeiconsIcon icon={Shield01Icon} size={17} className="text-[#0A66C2] shrink-0" />
              <span>Multi-Source Ingestion & Agency Heuristics Audit</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] p-4 dark:border-[#30363D] dark:bg-[#1F2428] space-y-1.5">
                <div className="text-xs font-semibold text-[#666666] dark:text-[#8B949E]">
                  Staffing Agency Guardrail
                </div>
                <p className="text-[13px] leading-snug text-[#191919] dark:text-[#F0F6FC]">
                  {current.company?.is_agency
                    ? "Flagged by Heuristic Detector as third-party staffing firm."
                    : "Direct Hiring Team verified. 0 recruitment intermediary signals."}
                </p>
                {current.review_reason && (
                  <p className="text-xs font-medium text-[#B24020] mt-1">
                    Reason: {current.review_reason}
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] p-4 dark:border-[#30363D] dark:bg-[#1F2428] space-y-1.5">
                <div className="text-xs font-semibold text-[#666666] dark:text-[#8B949E]">
                  Deduplication Strategy
                </div>
                <p className="text-[13px] leading-snug text-[#191919] dark:text-[#F0F6FC]">
                  Exact source ID match + Normalized Title Hash (`{current.normalized_title || "canonical"}`)
                </p>
                <p className="text-[11.5px] text-[#666666] dark:text-[#8B949E]">
                  Preserves source provenance across Greenhouse, Ashby, Lever & Cutshort.
                </p>
              </div>
            </div>

            {/* Linked Source References */}
            {current.source_references && current.source_references.length > 0 && (
              <div className="pt-2 space-y-2.5 border-t border-[#E0DFDC]/70 dark:border-[#30363D]/70">
                <div className="text-xs font-semibold text-[#666666] dark:text-[#8B949E]">
                  Provenance References ({current.source_references.length}):
                </div>
                <div className="space-y-2">
                  {current.source_references.map((src) => (
                    <div
                      key={src.id}
                      className="flex items-center justify-between rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] px-4 py-2 text-xs dark:border-[#30363D] dark:bg-[#1F2428]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-[#0A66C2] text-xs">{src.source_id}</span>
                        <span className="text-[#666666] dark:text-[#8B949E]">Job ID: {src.source_job_id}</span>
                      </div>
                      {src.source_url && (
                        <a
                          href={src.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-semibold text-[#0A66C2] hover:underline"
                        >
                          <span>View ATS Listing</span>
                          <HugeiconsIcon icon={Link01Icon} size={12} strokeWidth={2} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Real Automated Audit Records */}
            {current.verification_records && current.verification_records.length > 0 && (
              <div className="pt-2 space-y-2 border-t border-[#E0DFDC]/70 dark:border-[#30363D]/70">
                <div className="text-xs font-semibold text-[#666666] dark:text-[#8B949E]">
                  Verification Audit Log ({current.verification_records.length}):
                </div>
                <div className="space-y-1.5">
                  {current.verification_records.map((vr) => (
                    <div
                      key={vr.id}
                      className="flex items-center justify-between rounded-lg border border-[#E0DFDC] bg-[#F8F9FA] px-4 py-2 text-xs dark:border-[#30363D] dark:bg-[#1F2428]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Status: {vr.status || "PASSED"}</span>
                        <span className="text-[#666666] dark:text-[#8B949E]">• Confidence: {Math.round(vr.confidence * 100)}%</span>
                      </div>
                      {vr.verified_at && (
                        <span className="text-[11px] text-muted-foreground">{new Date(vr.verified_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Clean Description from Real Backend */}
          <div className="space-y-3 pb-4">
            <div className="flex items-center gap-2">
              <HugeiconsIcon icon={Briefcase01Icon} size={16} className="text-[#0A66C2]" />
              <h4 className="text-sm font-bold text-[#191919] dark:text-[#F0F6FC]">
                Job Description & Sourcing Criteria
              </h4>
            </div>
            <div className="rounded-xl border border-[#E0DFDC] bg-[#FAFAFA] p-5 text-[13.5px] leading-relaxed text-[#191919] dark:border-[#30363D] dark:bg-[#1F2428] dark:text-[#F0F6FC] whitespace-pre-wrap font-sans">
              {formatJobDescription(
                current.description ||
                  current.description_clean ||
                  current.description_raw
              )}
            </div>
          </div>
          </div>
        </ScrollArea>

        {/* Fixed Action bar */}
        <div className="flex items-center justify-between gap-2 border-t border-[#E0DFDC] px-4 py-3 sm:px-8 sm:py-4.5 dark:border-[#30363D] shrink-0 bg-white dark:bg-[#24292E]">
          <Button variant="secondary" size="compact" onClick={() => onOpenChange(false)}>
            Close
          </Button>

          {current.application_url && (
            <Button
              variant="primary"
              size="default"
              className="text-xs sm:text-sm px-3 sm:px-4"
              render={
                <a
                  href={current.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                />
              }
            >
              <span className="sm:hidden">Apply on ATS</span>
              <span className="hidden sm:inline">Apply on Company ATS Portal</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
