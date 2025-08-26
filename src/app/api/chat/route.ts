import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { text?: string };
    const userText: string = body?.text ?? "";
    const reply = userText
      ? `I heard: ${userText}. How are you feeling about that?`
      : "Hello! Tell me what is on your mind.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ error: "chat_error" }, { status: 500 });
  }
}
