import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided in form data." }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const res = await fetch(`${BACKEND_URL}/profile/upload-resume`, {
      method: "POST",
      body: backendFormData,
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
      { error: `Failed to upload and parse resume: ${errorMessage}` },
      { status: 503 }
    );
  }
}
