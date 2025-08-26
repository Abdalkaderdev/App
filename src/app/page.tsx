"use client";

import { useState } from "react";
import VoiceWave from "../components/VoiceWave";

type Mode = "idle" | "listening" | "speaking";

export default function Home() {
  const [mode, setMode] = useState<Mode>("idle");

  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20 grid place-items-center font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col items-center gap-8">
        {/* Bubble */}
        <div
          className={
            `relative max-w-[28rem] rounded-3xl border border-foreground/10 bg-background/80 px-6 py-5 text-center shadow-sm will-change-transform ` +
            (mode === "idle" ? "animate-bubble-idle " : "") +
            (mode === "speaking" ? "scale-105 " : "")
          }
        >
          <p className="text-sm sm:text-base">
            Hi! I can animate based on state: idle, listening, or speaking.
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
          onClick={() =>
            setMode((prev) =>
              prev === "idle" ? "listening" : prev === "listening" ? "speaking" : "idle",
            )
          }
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
        {/* Docs link for E2E test */}
        <a href="/docs" className="text-sm underline">
          Read our docs
        </a>
      </main>
    </div>
  );
}
