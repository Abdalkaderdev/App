import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type VoiceSphereProps = {
	apiBaseUrl?: string;
	voiceId?: string;
	maxRecordMs?: number;
	lang?: string;
	useStreaming?: boolean;
	enableHaptics?: boolean;
	enablePushToTalk?: boolean;
	enableVAD?: boolean;
	enableKeyboardShortcuts?: boolean;
	onError?: (err: unknown) => void;
	onStartListening?: () => void;
	onStopListening?: (transcript: string) => void;
	onStartSpeaking?: () => void;
	onStopSpeaking?: () => void;
};

type AppState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error' | 'disabled';

const crisisKeywords = [
	'suicide', 'kill myself', 'end my life', 'self harm', 'hurt myself', 'overdose', 'no reason to live', 'want to die'
];

function includesCrisisTerms(text: string): boolean {
	const lower = text.toLowerCase();
	return crisisKeywords.some(k => lower.includes(k));
}

export function VoiceSphere({
	apiBaseUrl = '/api',
	voiceId,
	maxRecordMs = 30000,
	lang = 'en-US',
	useStreaming = true,
	enableHaptics = true,
	enablePushToTalk = true,
	enableVAD = true,
	enableKeyboardShortcuts = true,
	onError,
	onStartListening,
	onStopListening,
	onStartSpeaking,
	onStopSpeaking,
}: VoiceSphereProps) {
	const [state, setState] = useState<AppState>('idle');
	const [toastMsg, setToastMsg] = useState<string>('');
	const [showDisabled, setShowDisabled] = useState<boolean>(false);
	const recognitionRef = useRef<any>(null);
	const recognitionActiveRef = useRef<boolean>(false);
	const recognitionTimeoutRef = useRef<number | undefined>(undefined);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const audioCtxRef = useRef<AudioContext | null>(null);
	const analyserRef = useRef<AnalyserNode | null>(null);
	const dataArrayRef = useRef<Uint8Array | null>(null);
	const audioSourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
	const rafIdRef = useRef<number | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const speakingRef = useRef<boolean>(false);
	const queueRef = useRef<string[]>([]);
	const audioUnlockedRef = useRef<boolean>(false);

	const css = useMemo(() => `
	:root { --bg: transparent; --fg: #e2e8f0; --muted: #94a3b8; --accent: #22d3ee; --danger: #ef4444; --sphere: #111827; }
	.vs_wrap { display: grid; place-items: center; width: 100%; }
	.vs_disclaimer { font-size: 12px; color: var(--muted); margin-bottom: 8px; }
	.vs_sphere { position: relative; width: min(68vh, 68vw); height: min(68vh, 68vw); max-width: 520px; max-height: 520px; min-width: 240px; min-height: 240px; border-radius: 9999px; background: radial-gradient(120% 120% at 50% 0%, #1f2937 0%, var(--sphere) 60%); box-shadow: 0 20px 80px rgba(0,0,0,0.5), inset 0 2px 12px rgba(255,255,255,0.05); transition: transform 220ms ease, box-shadow 220ms ease; animation: vs_breathe 5s ease-in-out infinite; display: grid; place-items: center; }
	.vs_sphere.vs_speaking { transform: scale(1.04); }
	.vs_sphere.vs_listening { box-shadow: 0 20px 100px rgba(34,211,238,0.35), inset 0 0 0 2px rgba(34,211,238,0.35); }
	.vs_sphere.vs_processing { opacity: 0.92; }
	@keyframes vs_breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
	.vs_voicewave { position: absolute; inset: 20% 12% auto 12%; height: 24%; display: flex; align-items: center; gap: 6px; opacity: 0; transition: opacity 160ms ease; }
	.vs_voicewave .bar { flex: 1; height: 14px; border-radius: 6px; background: linear-gradient(180deg, var(--accent), #60a5fa); animation: vs_eq 1000ms ease-in-out infinite; transform-origin: center bottom; opacity: 0.9; }
	.vs_voicewave .bar:nth-child(2) { animation-delay: 100ms; }
	.vs_voicewave .bar:nth-child(3) { animation-delay: 200ms; }
	.vs_voicewave .bar:nth-child(4) { animation-delay: 300ms; }
	.vs_voicewave .bar:nth-child(5) { animation-delay: 400ms; }
	@keyframes vs_eq { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
	.vs_sphere.vs_speaking .vs_voicewave { opacity: 1; }
	.vs_spinner { position: absolute; width: 48px; height: 48px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.12); border-top-color: var(--accent); animation: vs_spin 900ms linear infinite; opacity: 0; transition: opacity 120ms ease; }
	@keyframes vs_spin { to { transform: rotate(360deg); } }
	.vs_sphere.vs_processing .vs_spinner { opacity: 1; }
	.vs_record { position: absolute; bottom: 18%; display: grid; place-items: center; gap: 6px; opacity: 0; transition: opacity 120ms ease; }
	.vs_record .dot { width: 12px; height: 12px; border-radius: 999px; background: var(--danger); box-shadow: 0 0 0 0 rgba(239,68,68,0.7); animation: vs_pulse 1.6s infinite; }
	.vs_record .pulse { width: 44px; height: 44px; border-radius: 999px; border: 2px solid rgba(239,68,68,0.4); animation: vs_ring 1.6s infinite; }
	@keyframes vs_pulse { 0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.7); } 70% { box-shadow: 0 0 0 12px rgba(239,68,68,0); } 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); } }
	@keyframes vs_ring { 0% { transform: scale(0.8); opacity: 1; } 80% { transform: scale(1.1); opacity: 0; } 100% { opacity: 0; } }
	.vs_sphere.vs_listening .vs_record { opacity: 1; }
	.vs_toast { position: absolute; bottom: 10%; left: 50%; transform: translateX(-50%); background: rgba(15,23,42,0.92); border: 1px solid rgba(255,255,255,0.08); color: var(--fg); padding: 10px 12px; border-radius: 10px; font-size: 14px; max-width: 90%; opacity: 0; pointer-events: none; transition: opacity 160ms ease; }
	.vs_toast.show { opacity: 1; }
	.vs_mic { margin-top: 18px; width: 80px; height: 80px; border-radius: 9999px; border: none; background: radial-gradient(120% 120% at 50% 0%, #22d3ee 0%, #0ea5e9 60%); color: white; box-shadow: 0 12px 40px rgba(14,165,233,0.45); cursor: pointer; transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease; }
	.vs_mic:active { transform: scale(0.98); }
	.vs_mic[disabled] { opacity: 0.6; cursor: not-allowed; }
	.vs_disabled_overlay { position: fixed; inset: 0; display: grid; place-items: center; background: rgba(0,0,0,0.6); backdrop-filter: blur(2px); }
	.vs_disabled_card { background: #0b1220; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 20px; max-width: 420px; text-align: center; color: var(--fg); }
	.vs_retry { margin-top: 12px; padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12); background: transparent; color: var(--fg); cursor: pointer; }
	@media (prefers-reduced-motion: reduce) {
		.vs_sphere { animation: none !important; }
		.vs_voicewave .bar { animation: none !important; transform: scaleY(0.4) !important; }
		.vs_spinner { animation: none !important; }
	}
	@media (min-width: 768px) { .vs_mic { width: 92px; height: 92px; } }
	`, []);

	const showToast = useCallback((message: string) => {
		setToastMsg(message);
		setTimeout(() => setToastMsg(''), 3500);
	}, []);

	const haptic = useCallback((ms: number) => {
		try { if (enableHaptics && navigator.vibrate) navigator.vibrate(ms); } catch {}
	}, [enableHaptics]);

	const ensureAudioContext = useCallback(async () => {
		if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
		try { await audioCtxRef.current.resume(); } catch {}
		return audioCtxRef.current;
	}, []);

	const initRecognition = useCallback(() => {
		const AnyWindow = window as any;
		const SR = AnyWindow.SpeechRecognition || AnyWindow.webkitSpeechRecognition;
		if (!SR) return null;
		const rec = new SR();
		rec.lang = lang;
		rec.interimResults = false;
		rec.maxAlternatives = 1;
		rec.continuous = false;
		return rec;
	}, [lang]);

	const requestMicPermission = useCallback(async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			return stream;
		} catch (e) {
			return null;
		}
	}, []);

	const stopListening = useCallback(() => {
		try {
			if (recognitionRef.current && recognitionActiveRef.current) {
				recognitionRef.current.stop();
			}
		} catch {}
	}, []);

	const startAnalyserFromStream = useCallback(async (stream: MediaStream) => {
		try {
			const ctx = await ensureAudioContext();
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 256;
			const bufferLength = analyser.frequencyBinCount;
			dataArrayRef.current = new Uint8Array(bufferLength);
			const source = ctx.createMediaStreamSource(stream);
			source.connect(analyser);
			analyserRef.current = analyser;
			loopVisual();
		} catch {}
	}, [ensureAudioContext]);

	const startAnalyserFromAudio = useCallback(async (el: HTMLAudioElement) => {
		try {
			const ctx = await ensureAudioContext();
			const analyser = ctx.createAnalyser();
			analyser.fftSize = 256;
			const bufferLength = analyser.frequencyBinCount;
			dataArrayRef.current = new Uint8Array(bufferLength);
			if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect();
			const node = ctx.createMediaElementSource(el);
			node.connect(analyser);
			analyser.connect(ctx.destination);
			audioSourceNodeRef.current = node;
			analyserRef.current = analyser;
			loopVisual();
		} catch {}
	}, [ensureAudioContext]);

	const stopAnalyser = useCallback(() => {
		try { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); } catch {}
		rAF(null => {});
		try { if (analyserRef.current) analyserRef.current.disconnect(); } catch {}
		try { if (audioSourceNodeRef.current) audioSourceNodeRef.current.disconnect(); } catch {}
	}, []);

	function rAF(cb: any) {
		// helper to satisfy TS when setting to null
		rafIdRef.current = null;
	}

	const loopVisual = useCallback(() => {
		const analyser = analyserRef.current; const dataArray = dataArrayRef.current; if (!analyser || !dataArray) return;
		analyser.getByteTimeDomainData(dataArray);
		let sum = 0; for (let i = 0; i < dataArray.length; i++) { const v = (dataArray[i] - 128) / 128; sum += v * v; }
		const rms = Math.sqrt(sum / dataArray.length);
		const bars = document.querySelectorAll('.vs_voicewave .bar');
		const base = Math.max(0.2, Math.min(1, rms * 3));
		bars.forEach((bar, i) => {
			const jitter = 0.85 + Math.random() * 0.3;
			const scale = Math.max(0.25, Math.min(1, base * (0.8 + i * 0.05) * jitter));
			(bar as HTMLElement).style.transform = `scaleY(${scale})`;
		});
		rafIdRef.current = requestAnimationFrame(loopVisual);
	}, []);

	const speakBlob = useCallback(async (blob: Blob) => {
		return new Promise<void>((resolve, reject) => {
			try {
				if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
				const url = URL.createObjectURL(blob);
				const audio = new Audio(); audioRef.current = audio; audio.src = url;
				audio.onplay = () => { setState('speaking'); onStartSpeaking?.(); haptic(6); startAnalyserFromAudio(audio); };
				audio.onended = () => { URL.revokeObjectURL(url); onStopSpeaking?.(); resolve(); };
				audio.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
				audio.play().catch(reject);
			} catch (e) { reject(e); }
		});
	}, [haptic, onStartSpeaking, onStopSpeaking, startAnalyserFromAudio]);

	const speakFallback = useCallback(async (text: string) => {
		return new Promise<void>((resolve) => {
			try {
				const utter = new SpeechSynthesisUtterance(text);
				utter.lang = lang;
				utter.rate = 1.0; utter.pitch = 1.0;
				utter.onstart = () => { setState('speaking'); onStartSpeaking?.(); haptic(6); };
				utter.onend = () => { onStopSpeaking?.(); resolve(); };
				utter.onerror = () => { onStopSpeaking?.(); resolve(); };
				window.speechSynthesis.cancel(); window.speechSynthesis.speak(utter);
			} catch { resolve(); }
		});
	}, [haptic, lang, onStartSpeaking, onStopSpeaking]);

	const handleTranscriptStreaming = useCallback(async (transcript: string) => {
		const trimmed = (transcript || '').trim();
		if (!trimmed) { setState('idle'); showToast('Heard nothing. Tap mic to try again.'); return; }
		if (includesCrisisTerms(trimmed)) { alert('If you are in crisis or considering self-harm, please seek immediate help from local emergency services or a trusted person. You are not alone.'); }
		setState('processing');
		try {
			const url = `${apiBaseUrl}/chat/stream?` + new URLSearchParams({ content: trimmed });
			const res = await fetch(url, { method: 'GET' });
			if (!res.ok || !res.body) throw new Error('sse failed');
			const reader = res.body.getReader(); const decoder = new TextDecoder('utf-8');
			let buffer = '';
			while (true) {
				const { value, done } = await reader.read(); if (done) break;
				buffer += decoder.decode(value, { stream: true });
				let idx; while ((idx = buffer.indexOf('\n\n')) >= 0) {
					const frame = buffer.slice(0, idx); buffer = buffer.slice(idx + 2);
					const line = frame.split('\n').find(l => l.startsWith('data: ')); if (!line) continue;
					const json = line.replace('data: ', ''); if (json === '[DONE]') break;
					try { const payload = JSON.parse(json); const textChunk = (payload?.text || '').trim(); if (textChunk) queueRef.current.push(textChunk); } catch {}
				}
			}
			if (queueRef.current.length > 0) { await playQueue(); } else { setState('idle'); }
		} catch (e) {
			onError?.(e); setState('error'); showToast('Error occurred. Tap mic to retry.');
		}
	}, [apiBaseUrl, onError, showToast]);

	const playQueue = useCallback(async () => {
		if (speakingRef.current) return; speakingRef.current = true;
		while (queueRef.current.length > 0) {
			const text = queueRef.current.shift() as string;
			try {
				const ttsRes = await fetch(`${apiBaseUrl}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voiceId }) });
				if (ttsRes.ok) { const blob = await ttsRes.blob(); await speakBlob(blob).catch(async () => { await speakFallback(text); }); }
				else { await speakFallback(text); }
			} catch { await speakFallback(text); }
		}
		speakingRef.current = false; setState('idle');
	}, [apiBaseUrl, speakBlob, speakFallback, voiceId]);

	const handleTranscript = useCallback(async (transcript: string) => {
		if (useStreaming) return handleTranscriptStreaming(transcript);
		const trimmed = (transcript || '').trim();
		if (!trimmed) { setState('idle'); showToast('Heard nothing. Tap mic to try again.'); return; }
		if (includesCrisisTerms(trimmed)) { alert('If you are in crisis or considering self-harm, please seek immediate help from local emergency services or a trusted person. You are not alone.'); }
		setState('processing');
		try {
			const chatRes = await fetch(`${apiBaseUrl}/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: trimmed }] }) });
			if (!chatRes.ok) throw new Error('chat failed');
			const { text } = await chatRes.json();
			const ttsRes = await fetch(`${apiBaseUrl}/tts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, voiceId }) });
			if (ttsRes.ok) { const blob = await ttsRes.blob(); await speakBlob(blob).catch(async () => { await speakFallback(text); }); } else { await speakFallback(text); }
			setState('idle');
		} catch (e) { onError?.(e); setState('error'); showToast('Error occurred. Tap mic to retry.'); }
	}, [apiBaseUrl, handleTranscriptStreaming, onError, showToast, speakBlob, speakFallback, useStreaming, voiceId]);

	const startListening = useCallback(() => {
		if (!recognitionRef.current) { recognitionRef.current = initRecognition(); }
		if (!recognitionRef.current) { setState('disabled'); setShowDisabled(true); return; }
		try {
			recognitionRef.current.onstart = async () => {
				recognitionActiveRef.current = true; setState('listening'); onStartListening?.(); haptic(8);
				try { if (!micStreamRef.current) micStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true }); await startAnalyserFromStream(micStreamRef.current); } catch {}
				recognitionTimeoutRef.current = window.setTimeout(() => { stopListening(); }, maxRecordMs);
				if (enableVAD) requestAnimationFrame(vadTick);
			};
			recognitionRef.current.onerror = (ev: any) => {
				if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') { setState('disabled'); setShowDisabled(true); return; }
				setState('error'); showToast('Microphone error.'); onError?.(ev);
			};
			recognitionRef.current.onresult = async (ev: any) => {
				const transcript = ev.results?.[0]?.[0]?.transcript ?? '';
				onStopListening?.(transcript);
				await handleTranscript(transcript);
			};
			recognitionRef.current.onend = () => { recognitionActiveRef.current = false; if (recognitionTimeoutRef.current) window.clearTimeout(recognitionTimeoutRef.current); };
			recognitionRef.current.start();
		} catch (e) { onError?.(e); setState('error'); showToast('Unable to start recording.'); }
	}, [enableVAD, handleTranscript, haptic, initRecognition, maxRecordMs, onError, onStartListening, onStopListening, showToast, startAnalyserFromStream, stopListening]);

	const onMicClick = useCallback(async () => {
		if (state === 'speaking') { try { stopAnalyser(); } catch {}; setState('idle'); return; }
		if (state === 'listening') { stopListening(); return; }
		const stream = await requestMicPermission(); if (!stream) { setState('disabled'); setShowDisabled(true); return; }
		micStreamRef.current = stream; startListening();
	}, [startListening, state, stopAnalyser, stopListening, requestMicPermission]);

	const retryPermissions = useCallback(async () => {
		const stream = await requestMicPermission(); if (stream) { setShowDisabled(false); setState('idle'); }
	}, [requestMicPermission]);

	// Simple VAD
	const VAD_MAX = 12; const VAD_SILENCE_THRESHOLD = 0.03; const VAD_SILENCE_FRAMES = 8; const vadWindowRef = useRef<number[]>([]);
	const vadTick = useCallback(() => {
		const analyser = analyserRef.current; const dataArray = dataArrayRef.current; if (!analyser || state !== 'listening' || !dataArray) return;
		analyser.getByteTimeDomainData(dataArray); let sum = 0; for (let i = 0; i < dataArray.length; i++) { const v = (dataArray[i] - 128) / 128; sum += v * v; }
		const rms = Math.sqrt(sum / dataArray.length);
		vadWindowRef.current.push(rms); if (vadWindowRef.current.length > VAD_MAX) vadWindowRef.current.shift();
		const recent = vadWindowRef.current.slice(-VAD_SILENCE_FRAMES); const avg = recent.reduce((a,b)=>a+b,0) / Math.max(1, recent.length);
		if (avg < VAD_SILENCE_THRESHOLD) { stopListening(); }
		requestAnimationFrame(vadTick);
	}, [state, stopListening]);

	// Keyboard shortcuts (space push-to-talk)
	useEffect(() => {
		if (!enableKeyboardShortcuts) return;
		let spaceDown = false;
		const down = async (e: KeyboardEvent) => {
			if (e.key === ' ' && !spaceDown) {
				spaceDown = true;
				if (state !== 'listening') {
					const stream = await requestMicPermission(); if (!stream) { setState('disabled'); setShowDisabled(true); return; }
					micStreamRef.current = stream; startListening();
					if (enableVAD) requestAnimationFrame(vadTick);
				}
				e.preventDefault();
			}
		};
		const up = (e: KeyboardEvent) => { if (e.key === ' ') { spaceDown = false; if (state === 'listening') stopListening(); e.preventDefault(); } };
		window.addEventListener('keydown', down, { passive: false }); window.addEventListener('keyup', up, { passive: false });
		return () => { window.removeEventListener('keydown', down as any); window.removeEventListener('keyup', up as any); };
	}, [enableKeyboardShortcuts, enableVAD, requestMicPermission, startListening, state, stopListening, vadTick]);

	// Push-to-talk via pointer
	useEffect(() => {
		if (!enablePushToTalk) return;
		let ptt = false;
		const start = async () => { ptt = true; const stream = await requestMicPermission(); if (!stream) { setState('disabled'); setShowDisabled(true); return; } micStreamRef.current = stream; startListening(); if (enableVAD) requestAnimationFrame(vadTick); };
		const end = () => { ptt = false; stopListening(); };
		const btn = document.querySelector('.vs_mic'); if (!btn) return;
		btn.addEventListener('pointerdown', start); btn.addEventListener('pointerup', end); btn.addEventListener('pointerleave', () => { if (ptt) end(); });
		return () => { btn.removeEventListener('pointerdown', start); btn.removeEventListener('pointerup', end); btn.removeEventListener('pointerleave', () => {}); };
	}, [enablePushToTalk, enableVAD, requestMicPermission, startListening, stopListening, vadTick]);

	// iOS audio unlock
	useEffect(() => {
		const unlock = async () => {
			if (audioUnlockedRef.current) return;
			try {
				const ctx = await ensureAudioContext();
				const o = ctx.createOscillator(); const g = ctx.createGain(); g.gain.value = 0.0001; o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.02);
				audioUnlockedRef.current = true;
			} catch {}
		};
		window.addEventListener('pointerdown', unlock, { passive: true });
		window.addEventListener('touchend', unlock, { passive: true });
		return () => { window.removeEventListener('pointerdown', unlock as any); window.removeEventListener('touchend', unlock as any); };
	}, [ensureAudioContext]);

	useEffect(() => {
		return () => {
			try { if (recognitionRef.current) recognitionRef.current.abort?.(); } catch {}
			try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; } } catch {}
		};
	}, []);

	const sphereClasses = useMemo(() => {
		return [ 'vs_sphere', state === 'speaking' ? 'vs_speaking' : '', state === 'listening' ? 'vs_listening' : '', state === 'processing' ? 'vs_processing' : '', ].filter(Boolean).join(' ');
	}, [state]);

	return (
		<div className="vs_wrap">
			<style>{css}</style>
			<div className="vs_disclaimer">Prototype — not therapy. In crisis? Seek help.</div>
			<div className={sphereClasses} aria-live="polite" aria-label="Assistant bubble">
				<div className="vs_voicewave" aria-hidden="true">
					<div className="bar"></div>
					<div className="bar"></div>
					<div className="bar"></div>
					<div className="bar"></div>
					<div className="bar"></div>
				</div>
				<div className="vs_spinner" aria-hidden="true"></div>
				<div className="vs_record" aria-hidden="true">
					<span className="dot"></span>
					<span className="pulse"></span>
				</div>
				<div className={`vs_toast ${toastMsg ? 'show' : ''}`} role="alert">{toastMsg}</div>
			</div>
			<button className="vs_mic" onClick={onMicClick} aria-label="Start recording" aria-pressed={state === 'listening'} disabled={state === 'processing' || state === 'speaking'}>
				<svg width="36" height="36" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
					<path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 14 0h-2zM11 19.93V22h2v-2.07A8.001 8.001 0 0 0 20 12h-2a6 6 0 1 1-12 0H4a8.001 8.001 0 0 0 7 7.93z"/>
				</svg>
			</button>
			{showDisabled && (
				<div className="vs_disabled_overlay" role="dialog" aria-modal="true">
					<div className="vs_disabled_card">
						<h2>Microphone disabled</h2>
						<p>Please enable mic permissions in your browser settings to use this prototype.</p>
						<button className="vs_retry" onClick={retryPermissions}>Try again</button>
					</div>
				</div>
			)}
		</div>
	);
}

export default VoiceSphere;