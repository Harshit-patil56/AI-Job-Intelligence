/**
 * Company logo resolution utility with 4-Tier Free-First Cascade:
 * Tier 1: Google High-Res Favicon CDN (Free, 128px)
 * Tier 2: DuckDuckGo Icons CDN (Free)
 * Tier 3: Logo.dev (Paid fallback with CDN token)
 * Tier 4: Letter Monogram
 */

const PUBLIC_TOKEN =
  process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_Y4dZPtzsQeCVhx0WuHzfpw";

const KNOWN_DOMAINS: Record<string, string> = {
  canonical: "canonical.com",
  ramp: "ramp.com",
  "ramp advisory llc": "ramp.com",
  postman: "postman.com",
  stripe: "stripe.com",
  openai: "openai.com",
  razorpay: "razorpay.com",
  uber: "uber.com",
  swiggy: "swiggy.com",
  zomato: "zomato.com",
  zepto: "zeptonow.com",
  cred: "cred.club",
  flipkart: "flipkart.com",
  phonepe: "phonepe.com",
  meesho: "meesho.com",
  groww: "groww.in",
  zerodha: "zerodha.com",
  ola: "olacabs.com",
  browserstack: "browserstack.com",
  inmobi: "inmobi.com",
  dream11: "dream11.com",
  atlassian: "atlassian.com",
  google: "google.com",
  microsoft: "microsoft.com",
  meta: "meta.com",
  amazon: "amazon.com",
  apple: "apple.com",
  github: "github.com",
  gitlab: "gitlab.com",
  figma: "figma.com",
  linear: "linear.app",
  vercel: "vercel.com",
};

/**
 * Strips corporate suffixes and legal abbreviations from company names.
 */
export function cleanCompanyName(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(
      /\b(advisory|technologies|solutions|services|pvt|ltd|limited|inc|llc|corp|corporation|holdings|india|hq|group)\b/gi,
      ""
    )
    .trim()
    .replace(/[,.-]+$/, "")
    .trim();
}

/**
 * Resolves the primary company domain from company name and optional application URL.
 * Handles ATS URL tokens (e.g. greenhouse boards, ashby tokens, lever slugs).
 */
export function resolveCompanyDomain(
  companyName: string,
  applicationUrl?: string | null
): string {
  const normalizedName = companyName?.toLowerCase().trim() || "";

  // 1. Direct dictionary match
  if (KNOWN_DOMAINS[normalizedName]) {
    return KNOWN_DOMAINS[normalizedName];
  }

  // 2. ATS Token extraction from URL
  if (applicationUrl) {
    try {
      const url = new URL(applicationUrl);
      const host = url.hostname.toLowerCase();
      const pathParts = url.pathname.split("/").filter(Boolean);

      // Greenhouse: boards.greenhouse.io/{companyToken}/jobs/...
      if (host.includes("greenhouse.io") && pathParts.length > 0) {
        const token = pathParts[0].toLowerCase();
        if (KNOWN_DOMAINS[token]) return KNOWN_DOMAINS[token];
        return `${token}.com`;
      }

      // Ashby: jobs.ashbyhq.com/{companyToken}/...
      if (host.includes("ashbyhq.com") && pathParts.length > 0) {
        const token = pathParts[0].toLowerCase();
        if (KNOWN_DOMAINS[token]) return KNOWN_DOMAINS[token];
        return `${token}.com`;
      }

      // Lever: jobs.lever.co/{companyToken}/...
      if (host.includes("lever.co") && pathParts.length > 0) {
        const token = pathParts[0].toLowerCase();
        if (KNOWN_DOMAINS[token]) return KNOWN_DOMAINS[token];
        return `${token}.com`;
      }

      // Custom company domain: careers.company.com -> company.com
      if (
        !host.includes("greenhouse") &&
        !host.includes("ashby") &&
        !host.includes("lever") &&
        !host.includes("cutshort") &&
        !host.includes("hirist") &&
        !host.includes("workday")
      ) {
        const parts = host.split(".");
        if (parts.length >= 2) {
          return parts.slice(-2).join(".");
        }
      }
    } catch {
      // Ignore URL parse failures
    }
  }

  // 3. Fallback: clean company name
  const cleaned = cleanCompanyName(companyName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (KNOWN_DOMAINS[cleaned]) {
    return KNOWN_DOMAINS[cleaned];
  }

  return cleaned ? `${cleaned}.com` : "";
}

/**
 * Returns logo sources avoiding circular icons (e.g. Google Favicon V2 which forces circular masks).
 * Uses logo.dev official square/vector brand assets with retina resolution.
 */
export function getLogoCascadeSources(domain: string): string[] {
  if (!domain) return [];

  return [
    // Official non-circular square brand mark via logo.dev CDN
    `https://img.logo.dev/${domain}?token=${PUBLIC_TOKEN}&size=80&format=png&retina=true`,
  ];
}

/**
 * Direct logo URL helper
 */
export function getCompanyLogoUrl(companyName: string): string {
  const domain = resolveCompanyDomain(companyName);
  const sources = getLogoCascadeSources(domain);
  return sources[0] || "";
}
