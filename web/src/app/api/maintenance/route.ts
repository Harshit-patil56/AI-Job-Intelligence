import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

const ALLOWED_ACTIONS = new Set([
  "archive-expired",
  "prune-rejected",
  "remediate-entities",
  "purge-logos",
  "vacuum",
  "reset-jobs",
]);

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/maintenance/stats`, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
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
      { error: `Could not connect to FastAPI server at ${BACKEND_URL}: ${errorMessage}` },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action;

    if (!action || !ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { error: `Invalid or missing action: ${action}` },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND_URL}/maintenance/${action}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
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
      { error: `Failed to execute maintenance action: ${errorMessage}` },
      { status: 503 }
    );
  }
}
