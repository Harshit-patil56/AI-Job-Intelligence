import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = searchParams.get("limit") || "20";
  const targetUrl = `${BACKEND_URL}/pipeline/runs?limit=${limit}`;

  try {
    const res = await fetch(targetUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { runs: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ runs: [] }, { status: 200 });
  }
}
