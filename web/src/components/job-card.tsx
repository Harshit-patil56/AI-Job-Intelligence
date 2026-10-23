"use client";

import * as React from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Location01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  Link01Icon,
  Layers01Icon,
  Time02Icon,
  CoinsDollarIcon,
} from "@hugeicons/core-free-icons";
import { useRegisterFluidHoverItem } from "@/hooks/use-fluid-hover";
import { fontWeights } from "@/lib/font-weight";
import { JobItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyAvatar } from "@/components/company-avatar";
import { getStatusBadgeProps } from "@/components/motion/pipeline-status";

interface JobCardProps {
  job: JobItem;
  index: number;
  registerItem: ReturnType<typeof import("@/hooks/use-fluid-hover").useFluidHover>["registerItem"];
  onSelectJob?: (job: JobItem) => void;
  isSelected?: boolean;
}

export function JobCard({
  job,
  index,
  registerItem,
  onSelectJob,
  isSelected = false,
}: JobCardProps) {
  const cardRef = React.useRef<HTMLDivElement>(null);
  useRegisterFluidHoverItem(registerItem, index, cardRef);

  // Priority classification (Official LinkedIn Blue / Neutral)
  const isP1 = job.role_priority === "P1";
  const isP2 = job.role_priority === "P2";
  const isP3 = job.role_priority === "P3";

  // Responsive target detection: new tab on desktop (>=640px), same tab on mobile
  const [isDesktop, setIsDesktop] = React.useState(true);
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(min-width: 640px)");
      setIsDesktop(media.matches);
      const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  // Freshness
  const formattedDate = job.posted_at
    ? new Date(job.posted_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "Active";

  // Salary / Offer Money resolution
  const salaryDisplay = React.useMemo(() => {
    if (job.salary_text && !job.salary_text.toLowerCase().startsWith("nan")) {
      return job.salary_text;
    }
    if (job.salary_min != null) {
      const curr = (job.salary_currency || "INR").toUpperCase();
      if (curr === "INR") {
        const minL = (job.salary_min / 100000).toFixed(1).replace(/\.0$/, "");
        const maxL = job.salary_max ? (job.salary_max / 100000).toFixed(1).replace(/\.0$/, "") : null;
        return maxL && maxL !== minL ? `₹${minL}L - ₹${maxL}L` : `₹${minL}L+`;
      }
      if (curr === "USD" || curr === "$") {
        const minK = Math.round(job.salary_min / 1000);
        const maxK = job.salary_max ? Math.round(job.salary_max / 1000) : null;
        return maxK && maxK !== minK ? `$${minK}k - $${maxK}k` : `$${minK}k+`;
      }
    }
    // Market estimate fallback
    if (job.role_priority === "P1") return "₹12L - ₹25L (Est.)";
    if (job.role_priority === "P2") return "₹10L - ₹20L (Est.)";
    if (job.role_priority === "P3") return "₹8L - ₹16L (Est.)";
    return null;
  }, [job.salary_text, job.salary_min, job.salary_max, job.salary_currency, job.role_priority]);

  const isVerified = job.verification_confidence >= 0.9;
  const isReview = job.status === "REVIEW";

  return (
    <div
      ref={cardRef}
      data-slot="job-card"
      data-fluid-hover-index={index}
      className={`group/card relative flex flex-col justify-between rounded-xl border p-3 sm:p-4 transition-all duration-80 ${
        isSelected
          ? "border-[#0A66C2] bg-white ring-2 ring-[#0A66C2]/20 shadow-sm dark:bg-[#24292E]"
          : "border-[#E0DFDC] bg-white shadow-xs dark:border-[#30363D] dark:bg-[#24292E]"
      }`}
    >
      <div>
        {/* Top header: Company Logo, Company Name, Verification, Priority */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Real Company Avatar with 4-Tier Free-First Cascade */}
            <CompanyAvatar
              companyName={job.company_name}
              applicationUrl={job.application_url}
              companyWebsite={job.company_website}
              size="md"
            />

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[14px] font-semibold text-[#191919] dark:text-[#F0F6FC]">
                  {job.company_name}
                </span>
                {isVerified && (
                  <span
                    title="Direct ATS Verified Employer"
                    className="flex items-center text-[#057642]"
                  >
                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={15} strokeWidth={2.5} />
                  </span>
                )}
                {isReview && (
                  <span
                    title="Requires Heuristic Audit"
                    className="flex items-center text-[#B24020]"
                  >
                    <HugeiconsIcon icon={AlertCircleIcon} size={15} strokeWidth={2} />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-[#666666] dark:text-[#8B949E]">
                <span>Confidence:</span>
                <span className="font-semibold text-[#191919] dark:text-[#F0F6FC]">
                  {Math.round(job.verification_confidence * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Status Badge & Priority Pill */}
          <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
            {job.application_status && (
              <Badge
                color={getStatusBadgeProps(job.application_status).color}
                size="compact"
              >
                {getStatusBadgeProps(job.application_status).label}
              </Badge>
            )}
            {isP1 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#0A66C2]/30 bg-[#E8F3FF] px-2.5 py-0.5 text-[11px] font-semibold text-[#0A66C2]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#0A66C2]" />
                P1 • GenAI
              </span>
            )}
            {isP2 && (
              <span className="inline-flex items-center rounded-full border border-[#004182]/20 bg-[#F0F4F8] px-2.5 py-0.5 text-[11px] font-medium text-[#004182] dark:text-[#70B5F9]">
                P2 • Backend
              </span>
            )}
            {isP3 && (
              <span className="inline-flex items-center rounded-full bg-[#F3F2F0] px-2.5 py-0.5 text-[11px] font-medium text-[#666666] dark:bg-[#30363D] dark:text-[#8B949E]">
                P3 • SWE
              </span>
            )}
            {!isP1 && !isP2 && !isP3 && (
              <span className="inline-flex items-center rounded-full bg-[#F3F2F0] px-2 py-0.5 text-[11px] text-[#666666] dark:bg-[#30363D] dark:text-[#8B949E]">
                General
              </span>
            )}
          </div>
        </div>

        {/* Job Title with ghost-span pattern for zero layout shift on weight changes */}
        <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[#191919] group-hover/card:text-[#0A66C2] transition-colors dark:text-[#F0F6FC]">
          <span className="inline-grid">
            <span
              className="col-start-1 row-start-1 line-clamp-2 transition-[color,font-variation-settings] duration-80"
              style={{
                fontVariationSettings: isSelected
                  ? fontWeights.bold
                  : fontWeights.semibold,
              }}
            >
              {job.title}
            </span>
            <span
              aria-hidden="true"
              className="col-start-1 row-start-1 line-clamp-2 invisible"
              style={{ fontVariationSettings: fontWeights.bold }}
            >
              {job.title}
            </span>
          </span>
        </h3>

        {/* Metadata badges: Location, Experience, Sources */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[12px] text-[#666666] dark:text-[#8B949E]">
          <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F2F0] px-2 py-1 dark:bg-[#30363D]">
            <HugeiconsIcon icon={Location01Icon} size={13} className="text-[#0A66C2]" />
            <span className="truncate max-w-[130px] font-medium text-[#191919] dark:text-[#F0F6FC]">
              {job.location || "India"}
            </span>
          </span>

          {job.experience_text && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#F3F2F0] px-2 py-1 dark:bg-[#30363D]">
              <HugeiconsIcon icon={Briefcase01Icon} size={13} className="text-[#666666]" />
              <span>{job.experience_text}</span>
            </span>
          )}

          {job.sources_count > 1 && (
            <span className="inline-flex items-center gap-1 rounded-md bg-[#E8F3FF] px-2 py-1 text-[#0A66C2] font-medium">
              <HugeiconsIcon icon={Layers01Icon} size={13} />
              <span>{job.sources_count} sources</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions: Audit Button and Direct Apply Button */}
      <div className="mt-4 flex items-center justify-between border-t border-[#E0DFDC] pt-3 dark:border-[#30363D]">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#666666] dark:text-[#8B949E] min-w-0">
          <span className="flex items-center gap-1 shrink-0">
            <HugeiconsIcon icon={Time02Icon} size={13} />
            <span>{formattedDate}</span>
          </span>
          {salaryDisplay && (
            <>
              <span className="text-[#999999] dark:text-[#666666] shrink-0">•</span>
              <span
                className="inline-flex items-center gap-1 font-semibold text-[#057642] dark:text-[#3FB950] truncate"
                title={`Compensation Offer: ${salaryDisplay}`}
              >
                <HugeiconsIcon icon={CoinsDollarIcon} size={13} className="shrink-0" />
                <span className="truncate">{salaryDisplay}</span>
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="compact"
            render={
              <Link
                href={`/jobs/${job.id}`}
                target={isDesktop ? "_blank" : undefined}
                rel={isDesktop ? "noopener noreferrer" : undefined}
              >
                View Details
              </Link>
            }
          />

          {job.application_url && (
            <Button
              variant="primary"
              size="compact"
              render={
                <a
                  href={job.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Apply
                </a>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
