import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

function cleanSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(advisory|technologies|solutions|services|pvt|ltd|limited|inc|llc|corp|corporation|holdings|india|hq|group)\b/gi, "")
    .trim()
    .replace(/[^a-z0-9]/g, "");
}

async function tryFetchImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(3000),
      headers: {
        Accept: "image/*,*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
      return null;
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    // Ignore placeholder 1x1 or empty images
    if (buffer.length < 250) return null;
    return buffer;
  } catch {
    return null;
  }
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

  const domain =
    domainParam ||
    KNOWN_DOMAINS[slug] ||
    KNOWN_DOMAINS[company.toLowerCase()] ||
    `${slug}.com`;

  const logosDir = path.join(process.cwd(), "public", "logos");
  const localFilePath = path.join(logosDir, `${slug}.png`);

  // 1. Check local persistent disk storage first (0ms, 0 external API calls)
  try {
    if (fs.existsSync(localFilePath)) {
      const cachedBuffer = await fs.promises.readFile(localFilePath);
      return new NextResponse(new Uint8Array(cachedBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Logo-Cache": "HIT-LOCAL-DISK",
        },
      });
    }
  } catch {
    // If disk read fails, proceed to network cascade
  }

  // 2. Cascade through sources (executed only once per company, then served from disk forever)
  const candidateUrls = [
    // Source A: Logo.dev (Official high-res non-circular square brand asset)
    `https://img.logo.dev/${domain}?token=${PUBLIC_TOKEN}&size=80&format=png&retina=true`,
    // Source B: Direct Apple Touch Icon from employer domain (square 180x180)
    `https://${domain}/apple-touch-icon.png`,
  ];

  for (const candidateUrl of candidateUrls) {
    const imageBuffer = await tryFetchImage(candidateUrl);
    if (imageBuffer) {
      // 3. Persist to disk so it NEVER needs to be fetched again
      try {
        if (!fs.existsSync(logosDir)) {
          fs.mkdirSync(logosDir, { recursive: true });
        }
        await fs.promises.writeFile(localFilePath, imageBuffer);
      } catch (err) {
        console.error("Failed to persist logo to disk:", err);
      }

      return new NextResponse(new Uint8Array(imageBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Logo-Cache": "MISS-SAVED-TO-DISK",
        },
      });
    }
  }

  // If all candidates fail, return 404
  return new NextResponse("Logo not found", { status: 404 });
}
