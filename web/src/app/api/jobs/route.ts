import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const targetUrl = new URL("/jobs/", BACKEND_URL);
  searchParams.forEach((val, key) => {
    targetUrl.searchParams.set(key, val);
  });

  try {
    const res = await fetch(targetUrl.toString(), {
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
        limit: 50,
        offset: 0,
        jobs: [],
        error: `Could not connect to FastAPI server at ${BACKEND_URL}: ${errorMessage}`,
      },
      { status: 503 }
    );
  }
}
