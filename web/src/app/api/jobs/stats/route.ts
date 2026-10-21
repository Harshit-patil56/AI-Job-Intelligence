import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/jobs/stats`, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Backend returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        total: 0,
        p1: 0,
        p2: 0,
        verified: 0,
        review: 0,
        error: `Could not connect to FastAPI server at ${BACKEND_URL}: ${errorMessage}`,
      },
      { status: 503 }
    );
  }
}
