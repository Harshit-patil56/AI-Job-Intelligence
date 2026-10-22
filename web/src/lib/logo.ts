/**
 * Company logo resolution utility with 4-Tier Free-First Cascade:
 * Tier 1: Google High-Res Favicon CDN (Free, 128px)
 * Tier 2: DuckDuckGo Icons CDN (Free)
 * Tier 3: Logo.dev (Paid fallback with CDN token)
 * Tier 4: Letter Monogram
 */

const PUBLIC_TOKEN =
  process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN || "pk_Y4dZPtzsQeCVhx0WuHzfpw";

// Authoritative dictionary of Indian and Global Tech Employers
export const KNOWN_DOMAINS: Record<string, string> = {
  // Indian Tech Unicorns & Startups
  swiggy: "swiggy.com",
  zomato: "zomato.com",
  zepto: "zeptonow.com",
  cred: "cred.club",
  razorpay: "razorpay.com",
  phonepe: "phonepe.com",
  paytm: "paytm.com",
  meesho: "meesho.com",
  groww: "groww.in",
  zerodha: "zerodha.com",
  ola: "olacabs.com",
  flipkart: "flipkart.com",
  postman: "postman.com",
  browserstack: "browserstack.com",
  inmobi: "inmobi.com",
  dream11: "dream11.com",
  urbancompany: "urbancompany.com",
  lenskart: "lenskart.com",
  nykaa: "nykaa.com",
  delhivery: "delhivery.com",
  pocketfm: "pocketfm.com",
  jodo: "jodo.in",
  materialdepot: "materialdepot.in",
  nineleaps: "nineleaps.com",
  rubixe: "rubixe.com",
  wissentechnology: "wissen.com",
  wissen: "wissen.com",
  kanerika: "kanerika.com",
  hirevoo: "hirevoo.com",

  // Major IT Services & Consulting in India
  tcs: "tcs.com",
  tataconsultancyservices: "tcs.com",
  infosys: "infosys.com",
  wipro: "wipro.com",
  hcl: "hcltech.com",
  hcltech: "hcltech.com",
  techmahindra: "techmahindra.com",
  ltimindtree: "ltimindtree.com",
  ltm: "ltimindtree.com",
  accenture: "accenture.com",
  cognizant: "cognizant.com",
  capgemini: "capgemini.com",
  deloitte: "deloitte.com",
  pwc: "pwc.com",
  ey: "ey.com",
  kpmg: "kpmg.com",
  luxoft: "luxoft.com",
  epamsystems: "epam.com",
  epam: "epam.com",
  birlasoft: "birlasoft.com",
  atos: "atos.net",
  capco: "capco.com",

  // Global Tech & Product Companies
  google: "google.com",
  microsoft: "microsoft.com",
  meta: "meta.com",
  amazon: "amazon.com",
  apple: "apple.com",
  netflix: "netflix.com",
  uber: "uber.com",
  stripe: "stripe.com",
  openai: "openai.com",
  atlassian: "atlassian.com",
  github: "github.com",
  gitlab: "gitlab.com",
  figma: "figma.com",
  linear: "linear.app",
  vercel: "vercel.com",
  datadog: "datadoghq.com",
  canonical: "canonical.com",
  ramp: "ramp.com",
  "ramp advisory llc": "ramp.com",
  newrelic: "newrelic.com",
  arm: "arm.com",
  samsung: "samsung.com",
  abb: "abb.com",
  abbott: "abbott.com",
  accelya: "accelya.com",
  amgen: "amgen.com",
  optum: "optum.com",
  jpmorgan: "jpmorganchase.com",
  jpmorganchase: "jpmorganchase.com",
  morganstanley: "morganstanley.com",
  goldmansachs: "goldmansachs.com",
  deshaw: "deshaw.com",
  cornerstoneondemand: "cornerstoneondemand.com",

  // Job platforms (only when they themselves are the hiring employer)
  linkedin: "linkedin.com",
  naukri: "naukri.com",
  glassdoor: "glassdoor.com",
  indeed: "indeed.com",
  cutshort: "cutshort.io",
  hirist: "hirist.tech",
  instahyre: "instahyre.com",
  wellfound: "wellfound.com",
};

// Known job boards and aggregator hosts that should NEVER be used as the hiring company's domain
export const JOB_PORTAL_HOSTS = [
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "glassdoor.co.in",
  "naukri.com",
  "cutshort.io",
  "hirist.tech",
  "instahyre.com",
  "wellfound.com",
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workday.com",
  "smartrecruiters.com",
  "myworkdayjobs.com",
];

/**
 * Strips corporate suffixes, legal abbreviations, and portal search tokens from company names.
 */
export function cleanCompanyName(raw: string): string {
  if (!raw) return "";

  // 1. Strip search matrix aggregator tokens like "JobSpy (AI Engineer)" or "Cutshort (python-jobs)"
  let cleaned = raw.replace(/^(jobspy|cutshort|hirist|instahyre|naukri|wellfound)\s*\([^)]*\)/gi, "").trim();
  if (!cleaned) cleaned = raw;

  // 2. Strip standard corporate suffixes and legal abbreviations
  return cleaned
    .replace(
      /\b(advisory|technologies|solutions|services|pvt|ltd|limited|inc|llc|corp|corporation|holdings|india|hq|group|software)\b/gi,
      ""
    )
    .trim()
    .replace(/[,.-]+$/, "")
    .trim();
}

/**
 * Resolves the primary company domain from company name, optional direct company website, and application URL.
 * Enforces Portal-Immunity: Job boards (LinkedIn, Indeed, Naukri, etc.) are never mistaken for the hiring employer.
 */
export function resolveCompanyDomain(
  companyName: string,
  applicationUrl?: string | null,
  companyWebsite?: string | null
): string {
  const normalizedName = (companyName || "").toLowerCase().trim();

  // 0. If direct verified company website is provided from backend
  if (companyWebsite) {
    try {
      const parsed = new URL(companyWebsite.startsWith("http") ? companyWebsite : `https://${companyWebsite}`);
      const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
      if (host && !JOB_PORTAL_HOSTS.some((p) => host.includes(p))) {
        return host;
      }
    } catch {
      // Fall through if URL parsing fails
    }
  }

  // 1. Direct dictionary match for known employers
  const directSlug = normalizedName.replace(/[^a-z0-9]/g, "");
  if (KNOWN_DOMAINS[directSlug]) {
    return KNOWN_DOMAINS[directSlug];
  }
  if (KNOWN_DOMAINS[normalizedName]) {
    return KNOWN_DOMAINS[normalizedName];
  }

  // 2. ATS Token extraction from URL (only for direct ATS boards, NOT aggregators)
  if (applicationUrl) {
    try {
      const url = new URL(applicationUrl);
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
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

      // Special check: Is this the job portal ITSELF hiring? (e.g. LinkedIn hiring for LinkedIn)
      const isPortalHiringSelf = JOB_PORTAL_HOSTS.some(
        (portal) => host.includes(portal) && normalizedName.includes(portal.split(".")[0])
      );
      if (isPortalHiringSelf) {
        return host;
      }

      // Custom company career domain (e.g., careers.stripe.com -> stripe.com)
      // Strictly ignore generic job portal domains so LinkedIn/Indeed never become the employer domain
      const isGenericPortal = JOB_PORTAL_HOSTS.some((portal) => host.includes(portal));
      if (!isGenericPortal) {
        const parts = host.split(".");
        if (parts.length >= 2) {
          return parts.slice(-2).join(".");
        }
      }
    } catch {
      // Ignore URL parse failures
    }
  }

  // 3. Fallback: only if clean name matches known dictionary
  const cleaned = cleanCompanyName(companyName)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

  if (KNOWN_DOMAINS[cleaned]) {
    return KNOWN_DOMAINS[cleaned];
  }

  // Do NOT invent fake domains like `${cleaned}.com` for unknown companies
  return "";
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
