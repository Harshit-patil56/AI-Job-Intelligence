"use client";

import * as React from "react";
import { resolveCompanyDomain, cleanCompanyName } from "@/lib/logo";

interface CompanyAvatarProps {
  companyName: string;
  applicationUrl?: string | null;
  companyWebsite?: string | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const MONOGRAM_PALETTES = [
  { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-300" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-300" },
  { bg: "bg-violet-50 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-300" },
  { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-300" },
  { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-300" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/40", text: "text-cyan-600 dark:text-cyan-300" },
  { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-600 dark:text-indigo-300" },
];

function getMonogramPalette(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return MONOGRAM_PALETTES[Math.abs(hash) % MONOGRAM_PALETTES.length];
}

function getMonogramInitials(name: string): string {
  const cleaned = cleanCompanyName(name).trim();
  if (!cleaned) return "C";
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

export function CompanyAvatar({
  companyName,
  applicationUrl,
  companyWebsite,
  className = "",
  size = "md",
}: CompanyAvatarProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);

  const domain = React.useMemo(
    () => resolveCompanyDomain(companyName, applicationUrl, companyWebsite),
    [companyName, applicationUrl, companyWebsite]
  );

  // Reset image state whenever companyName or domain changes
  React.useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [domain, companyName]);

  const sizeClasses = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-10 w-10 text-xs",
    lg: "h-11 w-11 text-sm",
  }[size];

  const palette = React.useMemo(() => getMonogramPalette(companyName || "C"), [companyName]);
  const initials = React.useMemo(() => getMonogramInitials(companyName || "C"), [companyName]);

  // Query /api/logo for all valid company names to allow dynamic Logo.dev discovery and disk caching
  const logoUrl = React.useMemo(() => {
    const trimmed = (companyName || "").trim();
    if (!trimmed || trimmed.toLowerCase() === "unknown company" || (trimmed.startsWith("__") && trimmed.endsWith("__"))) {
      return null;
    }
    return `/api/logo?company=${encodeURIComponent(trimmed)}&domain=${encodeURIComponent(domain || "")}`;
  }, [companyName, domain]);

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-lg overflow-hidden font-semibold select-none ${palette.bg} ${palette.text} ${sizeClasses} ${className}`}
    >
      {/* 1. Base Layer: Instant 0ms fallback monogram (never blank, zero layout shift) */}
      <span className="font-bold tracking-tight">
        {initials}
      </span>

      {/* 2. Top Layer: Real company brand logo (fades in smoothly when available) */}
      {logoUrl && !hasError && (
        <img
          src={logoUrl}
          alt={companyName}
          className={`absolute inset-0 h-full w-full object-cover rounded-[inherit] bg-white dark:bg-[#1F2428] transition-opacity duration-150 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}
