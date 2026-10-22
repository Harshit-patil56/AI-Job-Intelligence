import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const resumeText = body.resume_text;

    if (!resumeText || !resumeText.trim()) {
      return NextResponse.json({ error: "No resume text provided." }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/profile/parse-text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ resume_text: resumeText, prefer_llm: true }),
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
      { error: `Failed to parse resume text: ${errorMessage}` },
      { status: 503 }
    );
  }
}
