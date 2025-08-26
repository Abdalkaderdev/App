import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "missing_groq_key" }, { status: 400 });
    }
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.startsWith("application/octet-stream")) {
      return NextResponse.json({ error: "invalid_content_type" }, { status: 400 });
    }
    const audioBuffer = await req.arrayBuffer();

    const form = new FormData();
    form.append("file", new Blob([audioBuffer], { type: "audio/webm" }), "audio.webm");
    form.append("model", "whisper-large-v3");
    form.append("response_format", "json");

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text().catch(() => "");
      return NextResponse.json({ error: "groq_error", detail: errText }, { status: 502 });
    }
    const data = (await groqRes.json()) as { text?: string };
    return NextResponse.json({ text: data?.text ?? "" });
  } catch {
    return NextResponse.json({ error: "stt_error" }, { status: 500 });
  }
}
