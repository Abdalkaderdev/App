import React, { useCallback, useEffect, useMemo, useState } from "react";

export type VoiceSphereState = "idle" | "listening" | "speaking" | "error";

export default function VoiceSphere(): JSX.Element {
  const [state, setState] = useState<VoiceSphereState>("idle");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (state === "error") {
      setIsShaking(true);
      const timeout = setTimeout(() => {
        setIsShaking(false);
        setState("idle");
      }, 450);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  // Demo: press "e" to trigger error state
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") setState("error");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sphereClasses = useMemo(() => {
    const base = [
      "relative",
      "rounded-full",
      "overflow-hidden",
      "flex items-center justify-center",
      // base soft blue glow
      "shadow-2xl shadow-blue-500/20",
      "will-change-transform",
    ].join(" ");

    const size = "w-72 h-72 md:w-96 md:h-96";

    const breathing = state === "idle" ? "animate-breathing" : "";
    const listeningScale = state === "listening" ? "scale-[1.05]" : "";
    const listeningGlow = state === "listening" ? "animate-glowing-pulse" : "";
    const shaking = isShaking ? "animate-shake-once" : "";

    return [base, size, breathing, listeningScale, listeningGlow, shaking]
      .filter(Boolean)
      .join(" ");
  }, [state, isShaking]);

  const handleMicClick = useCallback(() => {
    setState((prev) => (prev === "listening" ? "idle" : "listening"));
  }, []);

  const renderSpeakingWaves = () => (
    <>
      <div
        className="absolute inset-0 rounded-full opacity-60 mix-blend-screen animate-wave-motion"
        style={{
          background:
            "radial-gradient(circle at 40% 60%, rgba(255,255,255,0.35) 0%, rgba(59,130,246,0.30) 40%, transparent 70%)",
          animationDelay: "0ms",
        }}
      />
      <div
        className="absolute inset-0 rounded-full opacity-50 mix-blend-screen animate-wave-motion"
        style={{
          background:
            "radial-gradient(circle at 60% 40%, rgba(255,255,255,0.25) 0%, rgba(29,78,216,0.28) 35%, transparent 70%)",
          animationDelay: "600ms",
        }}
      />
    </>
  );

  const micButton = (
    <button
      type="button"
      aria-label={state === "listening" ? "Stop listening" : "Start listening"}
      onClick={handleMicClick}
      className={[
        "relative z-20",
        "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
        "bg-white text-blue-600",
        state === "listening" ? "animate-pulse-red" : "",
      ].join(" ")}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden="true"
      >
        <path d="M12 14a3 3 0 0 0 3-3V7a3 3 0 1 0-6 0v4a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 11h-2Z" />
      </svg>
    </button>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
      <div className={sphereClasses}>
        {/* Shimmering blue gradient background layer */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 animate-gradient-shift" />

        {/* Speaking inner waves */}
        {state === "speaking" && renderSpeakingWaves()}

        {/* Center overlay content (mic hidden while speaking) */}
        {state !== "speaking" && micButton}
      </div>
    </div>
  );
}
