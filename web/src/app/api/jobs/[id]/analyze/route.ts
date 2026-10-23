import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("force_refresh") === "true";
  const targetUrl = `${BACKEND_URL}/jobs/${id}/analyze?force_refresh=${forceRefresh}`;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      let detail = `Backend returned ${res.status}`;
      try {
        const errJson = await res.json();
        detail = errJson.detail || errJson.error || detail;
      } catch {
        const text = await res.text().catch(() => "");
        if (text) detail = text;
      }
      return NextResponse.json(
        { error: detail, detail },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to invoke AI analysis: ${errorMessage}` },
      { status: 503 }
    );
  }
}
