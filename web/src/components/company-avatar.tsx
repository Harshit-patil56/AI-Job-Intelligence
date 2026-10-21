"use client";

import * as React from "react";
import { resolveCompanyDomain, cleanCompanyName } from "@/lib/logo";

interface CompanyAvatarProps {
  companyName: string;
  applicationUrl?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CompanyAvatar({
  companyName,
  applicationUrl,
  className = "",
  size = "md",
}: CompanyAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const [srcIndex, setSrcIndex] = React.useState(0);

  const domain = React.useMemo(
    () => resolveCompanyDomain(companyName, applicationUrl),
    [companyName, applicationUrl]
  );

  const slug = React.useMemo(
    () =>
      cleanCompanyName(companyName || domain.split(".")[0])
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ""),
    [companyName, domain]
  );

  // Reset error & index if company or domain changes
  React.useEffect(() => {
    setHasError(false);
    setSrcIndex(0);
  }, [domain, slug]);

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-11 w-11 text-base",
  }[size];

  const initial = (companyName || "C").trim().charAt(0).toUpperCase();

  // Tier 1: Local disk asset directly from public/logos/{slug}.png (0ms, offline, free)
  // Tier 2: /api/logo (probes non-circular free sources, writes to public/logos, and serves)
  const candidateSrcs = React.useMemo(
    () => [
      `/logos/${slug}.png`,
      `/api/logo?company=${encodeURIComponent(companyName)}&domain=${encodeURIComponent(domain)}`,
    ],
    [slug, companyName, domain]
  );

  const currentSrc =
    !hasError && srcIndex < candidateSrcs.length ? candidateSrcs[srcIndex] : null;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg overflow-hidden bg-white shadow-2xs dark:bg-[#1F2428] ${sizeClasses} ${className}`}
    >
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={companyName}
          className="h-full w-full object-cover block rounded-[inherit]"
          onError={() => {
            if (srcIndex + 1 < candidateSrcs.length) {
              setSrcIndex((prev) => prev + 1);
            } else {
              setHasError(true);
            }
          }}
          loading="lazy"
        />
      ) : (
        <span className="font-bold text-[#191919] select-none dark:text-[#F0F6FC]">
          {initial}
        </span>
      )}
    </div>
  );
}
