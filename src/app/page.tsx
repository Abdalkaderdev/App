"use client";

import { useMemo, useState } from "react";
import VoiceWave from "../components/VoiceWave";
import { listenOnce, speak } from "@/lib/speech";
import { recordOnce } from "@/lib/record";

type Mode = "idle" | "listening" | "speaking";

function isWebSpeechSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as Window & { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown };
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("idle");
  const [error, setError] = useState<string | null>(null);
  const webSpeechSupported = useMemo(isWebSpeechSupported, []);

  async function requestMicPermission(): Promise<void> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error("Microphone permission denied");
    }
  }

  async function handleMicClick() {
    if (mode !== "idle") {
      setMode("idle");
      return;
    }
    setError(null);
    setMode("listening");
    try {
      await requestMicPermission();

      let userText = "";
      if (webSpeechSupported) {
        const { transcript } = await listenOnce({ lang: "en-US" });
        userText = transcript?.trim();
      } else {
        // Record short audio and send to server STT
        const { blob } = await recordOnce(4000);
        const arrayBuffer = await blob.arrayBuffer();
        const sttRes = await fetch("/api/stt", {
          method: "POST",
          headers: { "content-type": "application/octet-stream" },
          body: arrayBuffer,
        });
        const sttData = (await sttRes.json()) as { text?: string };
        userText = sttData?.text?.trim() ?? "";
      }

      if (!userText) {
        setMode("idle");
        return;
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: userText }),
      });
      const data = (await res.json()) as { reply?: string };
      const reply: string = data?.reply ?? "I am here and listening.";

      setMode("speaking");
      if (webSpeechSupported) {
        await speak(reply, { lang: "en-US", rate: 1.0, pitch: 1.0 });
      } else {
        const ttsRes = await fetch("/api/tts", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ text: reply }),
        });
        if (ttsRes.ok) {
          const audioBuffer = await ttsRes.arrayBuffer();
          const audio = new Audio(
            URL.createObjectURL(new Blob([audioBuffer], { type: "audio/mpeg" })),
          );
          audio.play().catch(() => {});
        }
      }
      setMode("idle");
    } catch (err: unknown) {
      const message =
        (err as { message?: string } | null)?.message ?? "Microphone or speech is not available";
      setError(message);
      setMode("idle");
    }
  }

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 grid place-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8">
        {!webSpeechSupported && (
          <div className="rounded-md border border-foreground/10 bg-background/70 px-3 py-2 text-xs">
            Web Speech API is not supported in this browser. Fallback is enabled. For the best
            experience,{" "}
            <a
              className="underline"
              href="https://www.google.com/chrome/"
              target="_blank"
              rel="noreferrer"
            >
              try in Chrome
            </a>
            .
          </div>
        )}

        {/* Bubble */}
        <div
          className={
            `relative max-w-[28rem] rounded-3xl border border-foreground/10 bg-background/80 px-6 py-5 text-center shadow-sm will-change-transform ` +
            (mode === "idle" ? "animate-bubble-idle " : "") +
            (mode === "speaking" ? "scale-105 " : "")
          }
        >
          <p className="text-sm sm:text-base">
            {mode === "listening"
              ? "Listening..."
              : mode === "speaking"
                ? "Speaking..."
                : "Hi! I can animate based on state: idle, listening, or speaking."}
          </p>
        </div>

        {/* VoiceWave (visible when speaking) */}
        <div className="h-10">
          <VoiceWave active={mode === "speaking"} />
        </div>

        {/* Mic button */}
        <button
          className={
            `relative flex h-16 w-16 items-center justify-center rounded-full bg-foreground text-background shadow will-change-transform ` +
            (mode === "listening" ? "animate-mic-listening " : "")
          }
          aria-label="Microphone"
          onClick={handleMicClick}
        >
          {/* Mic icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7"
            aria-hidden="true"
          >
            <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3z" />
            <path d="M5 11a1 1 0 1 0-2 0 9 9 0 0 0 8 8v2H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-2a9 9 0 0 0 8-8 1 1 0 1 0-2 0 7 7 0 0 1-14 0z" />
          </svg>

          {/* Red dot indicator when listening */}
          {mode === "listening" && (
            <span className="absolute -top-1 -right-1 inline-block h-3 w-3 rounded-full bg-red-500 will-change-transform animate-red-dot" />
          )}
        </button>

        {/* State controls for demo */}
        <div className="flex items-center gap-2 text-xs">
          <label className="opacity-70">State:</label>
          <div className="flex rounded-lg border border-foreground/10 overflow-hidden">
            <button
              className={`px-3 py-1 ${mode === "idle" ? "bg-foreground text-background" : ""}`}
              onClick={() => setMode("idle")}
            >
              Idle
            </button>
            <button
              className={`px-3 py-1 ${mode === "listening" ? "bg-foreground text-background" : ""}`}
              onClick={() => setMode("listening")}
            >
              Listening
            </button>
            <button
              className={`px-3 py-1 ${mode === "speaking" ? "bg-foreground text-background" : ""}`}
              onClick={() => setMode("speaking")}
            >
              Speaking
            </button>
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        {/* Docs link for E2E test */}
        <a href="/docs" className="text-sm underline">
          Read our docs
        </a>
      </main>
    </div>
  );
}
