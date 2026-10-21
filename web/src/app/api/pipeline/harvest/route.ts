import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const isMatrix = Boolean(body.is_matrix);
    const targetUrl = isMatrix
      ? `${BACKEND_URL}/pipeline/harvest/matrix`
      : `${BACKEND_URL}/pipeline/harvest`;

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `Harvest failed with status ${res.status}: ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to trigger harvest: ${errorMessage}` },
      { status: 500 }
    );
  }
}
