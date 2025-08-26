import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			colors: {
				background: "var(--background)",
				foreground: "var(--foreground)",
			},
			keyframes: {
				bubblePulse: {
					"0%, 100%": { transform: "scale(0.98)" },
					"50%": { transform: "scale(1.02)" },
				},
				micPulse: {
					"0%, 100%": { transform: "scale(1)" },
					"50%": { transform: "scale(1.08)" },
				},
				barScaleY: {
					"0%, 100%": { transform: "scaleY(0.3)" },
					"50%": { transform: "scaleY(1)" },
				},
				redDotPulse: {
					"0%, 100%": { transform: "scale(0.6)" },
					"50%": { transform: "scale(1)" },
				},
			},
			animation: {
				"bubble-idle": "bubblePulse 2.4s ease-in-out infinite",
				"mic-listening": "micPulse 1.2s ease-in-out infinite",
				"bar-wave": "barScaleY 1s ease-in-out infinite",
				"red-dot": "redDotPulse 1.2s ease-in-out infinite",
			},
		},
	},
	plugins: [],
};
export default config;
