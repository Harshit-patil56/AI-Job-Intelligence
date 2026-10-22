import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Official Logo.dev credentials from environment
const PUBLIC_TOKEN =
  process.env.LOGO_DEV_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN ||
  "pk_Y4dZPtzsQeCVhx0WuHzfpw";

const SECRET_KEY =
  process.env.LOGO_DEV_SECRET_KEY ||
  "sk_dhpuIc5hTiuM8yeA7DWwqA";

// Generic job aggregators whose domains must NEVER be treated as the employer's domain
const JOB_PORTAL_HOSTS = [
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
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
];

// In-memory cache for ultra-low latency (<1ms) and deduplication
const MEMORY_LOGO_CACHE = new Map<string, Buffer>();

/**
 * Locate persistent on-disk logo storage directory.
 * Located at data/logos in project root, outside web/ to prevent Next.js HMR reload loops.
 */
function getLogosDir(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", "data", "logos"),
    path.resolve(process.cwd(), "data", "logos"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  // Create candidate 1
  try {
    fs.mkdirSync(candidates[0], { recursive: true });
    return candidates[0];
  } catch {
    fs.mkdirSync(candidates[1], { recursive: true });
    return candidates[1];
  }
}

function cleanSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^(jobspy|cutshort|hirist|instahyre|naukri|wellfound)\s*\([^)]*\)/gi, "")
    .replace(/\b(advisory|technologies|solutions|services|pvt|ltd|limited|inc|llc|corp|corporation|holdings|india|hq|group|software)\b/gi, "")
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

async function tryFetchBuffer(url: string, headers: Record<string, string> = {}): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3500),
      headers: {
        Accept: "image/*,*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        ...headers,
      },
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 250) return null;
    return buffer;
  } catch {
    return null;
  }
}

/**
 * Dynamically discover the real corporate domain via Logo.dev search API.
 * Avoids any hardcoding — discovers official company domain automatically.
 */
async function discoverDomainWithLogoDev(companyName: string): Promise<string | null> {
  try {
    const cleanName = companyName
      .replace(/^(jobspy|cutshort|hirist|instahyre|naukri|wellfound)\s*\([^)]*\)/gi, "")
      .replace(/\b(advisory|technologies|solutions|services|pvt|ltd|limited|inc|llc|corp|corporation|holdings|india|hq|group)\b/gi, "")
      .trim();

    if (!cleanName || cleanName.length < 2) return null;

    const query = encodeURIComponent(cleanName);
    const searchUrl = `https://api.logo.dev/search?q=${query}`;

    const res = await fetch(searchUrl, {
      signal: AbortSignal.timeout(3000),
      headers: {
        Authorization: `Bearer ${SECRET_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) return null;
    const items = await res.json();
    if (Array.isArray(items) && items.length > 0 && items[0]?.domain) {
      const d = String(items[0].domain).toLowerCase().trim().replace(/^www\./, "");
      if (d && !JOB_PORTAL_HOSTS.some((p) => d.includes(p))) {
        return d;
      }
    }
  } catch {
    // Search lookup timeout or error
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company")?.trim() || "";
  const domainParam = searchParams.get("domain")?.trim() || "";

  if (!company && !domainParam) {
    return new NextResponse("Missing company or domain", { status: 400 });
  }

  const slug = cleanSlug(company || domainParam.split(".")[0]);
  if (!slug) {
    return new NextResponse("Invalid slug", { status: 400 });
  }

  // 1. Fast in-memory cache check (<1ms)
  if (MEMORY_LOGO_CACHE.has(slug)) {
    const cached = MEMORY_LOGO_CACHE.get(slug)!;
    if (cached.length === 0) {
      return new NextResponse("Logo not found", { status: 404 });
    }
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, immutable",
        "X-Logo-Cache": "HIT-MEMORY",
      },
    });
  }

  // 2. Persistent on-disk storage check (data/logos/<slug>.png)
  const logosDir = getLogosDir();
  const filePath = path.join(logosDir, `${slug}.png`);
  try {
    if (fs.existsSync(filePath)) {
      const diskBuffer = await fs.promises.readFile(filePath);
      MEMORY_LOGO_CACHE.set(slug, diskBuffer);
      return new NextResponse(new Uint8Array(diskBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Logo-Cache": "HIT-DISK",
        },
      });
    }
  } catch {
    // Continue to network fetch on disk read failure
  }

  // 3. Resolve real company domain dynamically (No Hardcoding)
  let resolvedDomain: string | null = null;

  // Case A: Domain passed as param and not a job aggregator host
  if (domainParam && domainParam.includes(".")) {
    const cleanParam = domainParam.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "").trim();
    if (!JOB_PORTAL_HOSTS.some((p) => cleanParam.includes(p))) {
      resolvedDomain = cleanParam;
    }
  }

  // Case B: Company name itself contains a domain (e.g. Jerry.ai, Scan.com, Plato.so)
  if (!resolvedDomain && company.includes(".")) {
    const words = company.trim().split(/\s+/);
    for (const w of words) {
      if (w.includes(".") && !w.startsWith("http") && !JOB_PORTAL_HOSTS.some((p) => w.toLowerCase().includes(p))) {
        resolvedDomain = w.toLowerCase().replace(/[^a-z0-9.-]/g, "").replace(/^\.+|\.+$/g, "");
        break;
      }
    }
  }

  // Case C: Dynamic Logo.dev Search API discovery using Secret Key
  if (!resolvedDomain) {
    resolvedDomain = await discoverDomainWithLogoDev(company);
  }

  // Case D: Clean company heuristic fallback (e.g. elchemy -> elchemy.com)
  if (!resolvedDomain && slug.length >= 3) {
    resolvedDomain = `${slug}.com`;
  }

  if (!resolvedDomain) {
    MEMORY_LOGO_CACHE.set(slug, Buffer.alloc(0));
    return new NextResponse("Logo not found", { status: 404 });
  }

  // 4. Download real brand logo via Logo.dev API
  const candidateUrls = [
    // Source 1: High-res square brand logo from Logo.dev using user token
    `https://img.logo.dev/${resolvedDomain}?token=${PUBLIC_TOKEN}&size=128&format=png&retina=true`,
    // Source 2: Direct Apple Touch Icon (high-res square icon from corporate site)
    `https://${resolvedDomain}/apple-touch-icon.png`,
    // Source 3: Google Favicon CDN (128px)
    `https://www.google.com/s2/favicons?domain=${resolvedDomain}&sz=128`,
  ];

  for (const url of candidateUrls) {
    const buffer = await tryFetchBuffer(url);
    if (buffer && buffer.length >= 250) {
      // 5. Store on disk permanently so we reuse it again and again
      try {
        await fs.promises.writeFile(filePath, buffer);
      } catch {
        // Disk write error ignored
      }
      // Store in memory cache
      MEMORY_LOGO_CACHE.set(slug, buffer);

      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=604800, immutable",
          "X-Logo-Cache": "MISS-STORED",
        },
      });
    }
  }

  // Negative cache so we don't spam the network repeatedly for non-existent brands
  MEMORY_LOGO_CACHE.set(slug, Buffer.alloc(0));
  return new NextResponse("Logo not found", { status: 404 });
}
