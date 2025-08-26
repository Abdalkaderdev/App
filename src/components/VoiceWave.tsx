import React from "react";

export type VoiceWaveProps = {
  active?: boolean;
};

export default function VoiceWave({ active = true }: VoiceWaveProps): JSX.Element {
  return (
    <div className="flex items-end justify-center gap-2">
      <div
        className={["w-1 rounded bg-blue-500 h-8", active ? "animate-wave" : ""].join(" ")}
        style={active ? { animationDelay: "0ms" } : undefined}
      />
      <div
        className={["w-1 rounded bg-blue-500 h-12", active ? "animate-wave" : ""].join(" ")}
        style={active ? { animationDelay: "120ms" } : undefined}
      />
      <div
        className={["w-1 rounded bg-blue-500 h-16", active ? "animate-wave" : ""].join(" ")}
        style={active ? { animationDelay: "240ms" } : undefined}
      />
      <div
        className={["w-1 rounded bg-blue-500 h-12", active ? "animate-wave" : ""].join(" ")}
        style={active ? { animationDelay: "360ms" } : undefined}
      />
      <div
        className={["w-1 rounded bg-blue-500 h-8", active ? "animate-wave" : ""].join(" ")}
        style={active ? { animationDelay: "480ms" } : undefined}
      />
    </div>
  );
}
