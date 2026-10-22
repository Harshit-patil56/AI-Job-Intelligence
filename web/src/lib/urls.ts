/**
 * URL validation utilities to prevent displaying invalid, fabricated, or broken links.
 * Policy: "need proper links if not dont show it"
 */

import { JOB_PORTAL_HOSTS, KNOWN_DOMAINS } from "./logo";

/**
 * Validates whether a generic web link is well-formed with an http(s) protocol and valid hostname.
 */
export function isValidUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed || trimmed === "null" || trimmed === "undefined") return false;

  try {
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase();
    return Boolean(host && host.includes(".") && host.length >= 4 && !host.includes("localhost"));
  } catch {
    return false;
  }
}

/**
 * Validates whether a company website is genuine, legitimate, and safe to display.
 * Rejects:
 * - Empty / null / invalid URLs
 * - Generic job portal domains mistakenly assigned as company websites (Cutshort, Hirist, LinkedIn, etc.)
 * - Fabricated slug domains (e.g., "neogencodetechnologiespvtltd.com" generated from company name)
 */
export function isValidCompanyWebsite(url?: string | null, companyName?: string): boolean {
  if (!isValidUrl(url)) return false;

  try {
    const trimmed = url!.trim();
    const parsed = new URL(trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`);
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");

    // 1. Must not be a job board portal
    if (JOB_PORTAL_HOSTS.some((portal: string) => host.includes(portal))) {
      return false;
    }

    // 2. If it's in our curated/known dictionary, it's explicitly verified
    if (Object.values(KNOWN_DOMAINS).includes(host)) {
      return true;
    }

    // 3. Reject synthetic slug domains (e.g. "neogencodetechnologiespvtltd.com")
    // When an unverified name has spaces/symbols stripped and blindly appended with .com
    if (companyName) {
      const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]/g, "");
      // If the slug is long (> 10 chars) and matches the domain stem exactly without having dots or hyphens
      const domainStem = host.split(".")[0];
      if (cleanSlug.length >= 10 && domainStem === cleanSlug) {
        return false;
      }
      // Also catch if host is e.g. "neogencodetechnologiespvtltd.com"
      if (host === `${cleanSlug}.com` || host === `${cleanSlug}.in` || host === `${cleanSlug}.tech`) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
