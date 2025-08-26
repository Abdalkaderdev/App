import React from "react";

export type VoiceWaveProps = {
	active?: boolean;
	barCount?: number;
	heightClassName?: string;
};

export default function VoiceWave({ active = false, barCount = 5, heightClassName = "h-10" }: VoiceWaveProps) {
	const bars = Array.from({ length: barCount });
	return (
		<div className={`flex items-end gap-1 ${heightClassName}`}>
			{bars.map((_, index) => (
				<div
					key={index}
					className={`w-1.5 rounded-sm bg-foreground origin-bottom will-change-transform ${active ? "animate-bar-wave" : ""} h-full`}
					style={active ? { animationDelay: `${index * 0.1}s` } : undefined}
				>
					<span className="sr-only">audio level</span>
				</div>
			))}
		</div>
	);
}