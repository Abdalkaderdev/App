import React, { useCallback, useEffect, useMemo, useState } from "react";
import VoiceWave from "./VoiceWave";

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
    const base =
      "rounded-full bg-white shadow-2xl flex items-center justify-center will-change-transform";
    const size = "w-72 h-72 md:w-96 md:h-96";
    const breathing = state === "idle" ? "animate-breathing" : "";
    const speaking = state === "speaking" ? "scale-[1.05]" : "";
    const shaking = isShaking ? "animate-shake-once" : "";
    return [base, size, breathing, speaking, shaking].filter(Boolean).join(" ");
  }, [state, isShaking]);

  const handleMicClick = useCallback(() => {
    setState((prev) => (prev === "listening" ? "idle" : "listening"));
  }, []);

  const renderContent = () => {
    if (state === "speaking") {
      return <VoiceWave />;
    }

    return (
      <button
        type="button"
        aria-label={state === "listening" ? "Stop listening" : "Start listening"}
        onClick={handleMicClick}
        className={[
          "w-16 h-16 rounded-full flex items-center justify-center shadow-lg",
          state === "listening"
            ? "bg-blue-600 text-white animate-pulse-red"
            : "bg-blue-600 text-white",
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
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
      <div className={sphereClasses}>{renderContent()}</div>
    </div>
  );
}
