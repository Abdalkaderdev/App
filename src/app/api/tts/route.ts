import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.ELEVENLABS_VOICE_ID;
    if (!apiKey || !voiceId) {
      return new Response(JSON.stringify({ error: "missing_elevenlabs_config" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    const { text } = (await req.json()) as { text?: string };
    const payload = {
      text: text ?? "Hello there",
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    };
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return new Response(JSON.stringify({ error: "elevenlabs_error", detail }), {
        status: 502,
        headers: { "content-type": "application/json" },
      });
    }
    const arrayBuffer = await res.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: { "content-type": "audio/mpeg" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "tts_error" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
