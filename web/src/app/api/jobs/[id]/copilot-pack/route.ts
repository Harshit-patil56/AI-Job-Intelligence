import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const targetUrl = `${BACKEND_URL}/jobs/${id}/copilot-pack`;

  try {
    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Backend returned ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to generate copilot pack: ${errorMessage}` },
      { status: 503 }
    );
  }
}
