const sphere = document.getElementById('sphere');
const micBtn = document.getElementById('micBtn');
const toast = sphere.querySelector('.toast');
const disabledOverlay = document.getElementById('disabledOverlay');
const retryPermsBtn = document.getElementById('retryPerms');

// State machine
const State = Object.freeze({
	IDLE: 'idle',
	LISTENING: 'listening',
	PROCESSING: 'processing',
	SPEAKING: 'speaking',
	ERROR: 'error',
	DISABLED: 'disabled'
});
let appState = State.IDLE;
let recognition = null;
let recognitionActive = false;
let recognitionTimeoutId = null;
const MAX_RECORD_MS = 30_000;

// Abort controllers for in-flight requests
let chatAbort = null;
let ttsAbort = null;

// WebAudio analyser for voicewave
let audioCtx = null;
let analyser = null;
let dataArray = null;
let micStream = null;
let audioSourceNode = null; // for playback element
let rafId = null;
const bars = Array.from(sphere.querySelectorAll('.voicewave .bar'));

// SSE sentence queue
let speakingQueue = [];
let speaking = false;

async function playQueue() {
	if (speaking) return;
	speaking = true;
	while (speakingQueue.length > 0) {
		const text = speakingQueue.shift();
		try {
			const ttsRes = await fetchWithTimeoutRetry('/api/tts', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ text })
			}, { timeoutMs: 25000, retries: 1 });
			if (ttsRes.ok) {
				const blob = await ttsRes.blob();
				await playAudioBlob(blob).catch(async () => { await speak(text); });
			} else {
				await speak(text);
			}
		} catch {
			await speak(text);
		}
	}
	speaking = false;
	setState(State.IDLE);
}

function startAnalyserFromStream(stream) {
	try {
		if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		analyser = audioCtx.createAnalyser();
		analyser.fftSize = 256;
		const bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);
		const source = audioCtx.createMediaStreamSource(stream);
		source.connect(analyser);
		loopVisual();
	} catch (e) { console.warn('analyser init error', e); }
}

function startAnalyserFromAudio(el) {
	try {
		if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
		analyser = audioCtx.createAnalyser();
		analyser.fftSize = 256;
		const bufferLength = analyser.frequencyBinCount;
		dataArray = new Uint8Array(bufferLength);
		if (audioSourceNode) audioSourceNode.disconnect();
		audioSourceNode = audioCtx.createMediaElementSource(el);
		audioSourceNode.connect(analyser);
		analyser.connect(audioCtx.destination);
		loopVisual();
	} catch (e) { console.warn('audio analyser init error', e); }
}

function stopAnalyser() {
	try { if (rafId) cancelAnimationFrame(rafId); } catch {}
	rafId = null;
	try { if (analyser) analyser.disconnect(); } catch {}
	try { if (audioSourceNode) audioSourceNode.disconnect(); } catch {}
}

function loopVisual() {
	if (!analyser) return;
	analyser.getByteTimeDomainData(dataArray);
	// Compute RMS
	let sum = 0;
	for (let i = 0; i < dataArray.length; i++) {
		const v = (dataArray[i] - 128) / 128;
		sum += v * v;
	}
	const rms = Math.sqrt(sum / dataArray.length); // 0..1
	const base = Math.max(0.2, Math.min(1, rms * 3));
	for (let i = 0; i < bars.length; i++) {
		const jitter = 0.85 + Math.random() * 0.3;
		const scale = Math.max(0.25, Math.min(1, base * (0.8 + i * 0.05) * jitter));
		bars[i].style.transform = `scaleY(${scale})`;
	}
	rafId = requestAnimationFrame(loopVisual);
}

function cleanupMicStream() {
	try { if (micStream) micStream.getTracks().forEach(t => t.stop()); } catch {}
	micStream = null;
}

function setState(next) {
	appState = next;
	sphere.classList.remove('state-idle','state-listening','state-processing','state-speaking');
	switch (next) {
		case State.IDLE:
			sphere.classList.add('state-idle');
			micBtn.disabled = false;
			micBtn.setAttribute('aria-pressed', 'false');
			stopAnalyser();
			cleanupMicStream();
			break;
		case State.LISTENING:
			sphere.classList.add('state-listening');
			micBtn.disabled = false;
			micBtn.setAttribute('aria-pressed', 'true');
			break;
		case State.PROCESSING:
			sphere.classList.add('state-processing');
			micBtn.disabled = true;
			break;
		case State.SPEAKING:
			sphere.classList.add('state-speaking');
			micBtn.disabled = true;
			break;
		case State.ERROR:
			micBtn.disabled = false;
			break;
		case State.DISABLED:
			micBtn.disabled = true;
			break;
	}
}

function showToast(message) {
	toast.textContent = message;
	toast.classList.add('show');
	setTimeout(() => toast.classList.remove('show'), 3500);
}

function crisisKeywordCheck(text) {
	const keywords = [
		'suicide', 'kill myself', 'end my life', 'self harm', 'hurt myself', 'overdose', 'no reason to live', 'want to die'
	];
	const lower = text.toLowerCase();
	return keywords.some(k => lower.includes(k));
}

function initRecognition() {
	const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
	if (!SpeechRecognition) {
		return null;
	}
	const rec = new SpeechRecognition();
	rec.lang = 'en-US';
	rec.interimResults = false;
	rec.maxAlternatives = 1;
	rec.continuous = false;
	return rec;
}

async function requestMicPermission() {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
		return stream;
	} catch (e) {
		return null;
	}
}

function abortInFlight() {
	try { if (chatAbort) chatAbort.abort(); } catch {}
	try { if (ttsAbort) ttsAbort.abort(); } catch {}
}

function fetchWithTimeoutRetry(url, opts = {}, { timeoutMs = 15000, retries = 1 } = {}) {
	return new Promise((resolve, reject) => {
		const attempt = (n) => {
			const ac = new AbortController();
			const timer = setTimeout(() => ac.abort(), timeoutMs);
			const merged = { ...opts, signal: ac.signal };
			fetch(url, merged).then(r => {
				clearTimeout(timer);
				resolve(r);
			}).catch(err => {
				clearTimeout(timer);
				if (n < retries && (err.name === 'AbortError' || err.name === 'TypeError')) {
					setTimeout(() => attempt(n + 1), 300);
				} else {
					reject(err);
				}
			});
		};
		attempt(0);
	});
}

function startListening() {
	if (!recognition) {
		recognition = initRecognition();
	}
	if (!recognition) {
		setState(State.DISABLED);
		disabledOverlay.hidden = false;
		return;
	}

	try {
		recognition.onstart = async () => {
			recognitionActive = true;
			setState(State.LISTENING);
			// Start mic analyser
			try {
				if (!micStream) {
					const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
					micStream = stream;
				}
				startAnalyserFromStream(micStream);
			} catch {}
			// safety stop after MAX_RECORD_MS
			recognitionTimeoutId = setTimeout(() => {
				stopListening();
			}, MAX_RECORD_MS);
		};

		recognition.onerror = (ev) => {
			console.warn('recognition error', ev.error);
			if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
				setState(State.DISABLED);
				disabledOverlay.hidden = false;
				return;
			}
			setState(State.ERROR);
			showToast('Something went wrong with the microphone.');
		};

		recognition.onresult = async (ev) => {
			const transcript = ev.results?.[0]?.[0]?.transcript ?? '';
			await handleTranscript(transcript);
		};

		recognition.onend = () => {
			recognitionActive = false;
			clearTimeout(recognitionTimeoutId);
		};

		recognition.start();
	} catch (e) {
		console.error('startListening error', e);
		setState(State.ERROR);
		showToast('Unable to start recording.');
	}
}

function stopListening() {
	try {
		if (recognition && recognitionActive) {
			recognition.stop();
		}
	} catch (e) {
		console.warn('stopListening error', e);
	}
}

async function handleTranscriptStreaming(transcript) {
	const trimmed = (transcript || '').trim();
	if (!trimmed) { setState(State.IDLE); showToast('Heard nothing. Tap mic to try again.'); return; }
	if (crisisKeywordCheck(trimmed)) { alert('If you are in crisis or considering self-harm, please seek immediate help from local emergency services or a trusted person. You are not alone.'); }
	setState(State.PROCESSING);
	abortInFlight();
	try {
		const url = `/api/chat/stream?` + new URLSearchParams({ content: trimmed });
		const res = await fetchWithTimeoutRetry(url, { method: 'GET' }, { timeoutMs: 30000, retries: 0 });
		if (!res.ok || !res.body) throw new Error('sse failed');
		const reader = res.body.getReader();
		const decoder = new TextDecoder('utf-8');
		let buffer = '';
		while (true) {
			const { value, done } = await reader.read();
			if (done) break;
			buffer += decoder.decode(value, { stream: true });
			let idx;
			while ((idx = buffer.indexOf('\n\n')) >= 0) {
				const frame = buffer.slice(0, idx);
				buffer = buffer.slice(idx + 2);
				const line = frame.split('\n').find(l => l.startsWith('data: '));
				if (!line) continue;
				const json = line.replace('data: ', '');
				if (json === '[DONE]') break;
				try {
					const payload = JSON.parse(json);
					const textChunk = (payload?.text || '').trim();
					if (textChunk) { speakingQueue.push(textChunk); }
				} catch {}
			}
		}
		if (speakingQueue.length > 0) {
			await playQueue();
		} else {
			setState(State.IDLE);
		}
	} catch (e) {
		console.error('streaming error', e);
		setState(State.ERROR);
		showToast('Error occurred. Tap mic to retry.');
	}
}

// Simple VAD using RMS threshold over window; stops rec on silence
let vadWindow = [];
const VAD_MAX = 12;
const VAD_SILENCE_THRESHOLD = 0.03; // tune
const VAD_SILENCE_FRAMES = 8;

function vadTick() {
	if (!analyser || appState !== State.LISTENING) return;
	analyser.getByteTimeDomainData(dataArray);
	let sum = 0;
	for (let i = 0; i < dataArray.length; i++) {
		const v = (dataArray[i] - 128) / 128; sum += v * v;
	}
	const rms = Math.sqrt(sum / dataArray.length);
	vadWindow.push(rms);
	if (vadWindow.length > VAD_MAX) vadWindow.shift();
	const recent = vadWindow.slice(-VAD_SILENCE_FRAMES);
	const avg = recent.reduce((a,b)=>a+b,0) / Math.max(1, recent.length);
	if (avg < VAD_SILENCE_THRESHOLD) {
		stopListening();
	}
	requestAnimationFrame(vadTick);
}

// Wire push-to-talk (press and hold)
let pttActive = false;
function bindPushToTalk() {
	const start = async () => {
		pttActive = true;
		const stream = await requestMicPermission();
		if (!stream) { setState(State.DISABLED); disabledOverlay.hidden = false; return; }
		micStream = stream;
		startListening();
		vadWindow = [];
		requestAnimationFrame(vadTick);
	};
	const end = () => {
		pttActive = false;
		stopListening();
	};
	micBtn.addEventListener('pointerdown', start);
	micBtn.addEventListener('pointerup', end);
	micBtn.addEventListener('pointerleave', () => { if (pttActive) end(); });
}

// Override result handler to choose streaming or non-streaming flow
async function handleTranscript(transcript) {
	if (USE_STREAMING) return handleTranscriptStreaming(transcript);
	// fallback non-streaming path
	const trimmed = (transcript || '').trim();
	if (!trimmed) { setState(State.IDLE); showToast('Heard nothing. Tap mic to try again.'); return; }
	if (crisisKeywordCheck(trimmed)) { alert('If you are in crisis or considering self-harm, please seek immediate help from local emergency services or a trusted person. You are not alone.'); }
	setState(State.PROCESSING);
	abortInFlight();
	try {
		chatAbort = new AbortController();
		const chatRes = await fetchWithTimeoutRetry('/api/chat', {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: [{ role: 'user', content: trimmed }] }), signal: chatAbort.signal
		}, { timeoutMs: 15000, retries: 1 });
		if (!chatRes.ok) throw new Error('chat failed');
		const { text } = await chatRes.json();
		ttsAbort = new AbortController();
		const ttsRes = await fetchWithTimeoutRetry('/api/tts', {
			method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text })
		}, { timeoutMs: 20000, retries: 1 });
		if (ttsRes.ok) { const blob = await ttsRes.blob(); await playAudioBlob(blob).catch(async () => { await speak(text); }); } else { await speak(text); }
		setState(State.IDLE);
	} catch (e) {
		console.error('processing error', e); setState(State.ERROR); showToast('Error occurred. Tap mic to retry.');
	}
}

function playAudioBlob(blob) {
	return new Promise((resolve, reject) => {
		try {
			const url = URL.createObjectURL(blob);
			const audio = new Audio();
			audio.src = url;
			audio.onplay = () => {
				setState(State.SPEAKING);
				try { startAnalyserFromAudio(audio); } catch {}
			};
			audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
			audio.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
			audio.play().catch(reject);
		} catch (e) { reject(e); }
	});
}

function speak(text) {
	return new Promise((resolve, reject) => {
		try {
			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = 'en-US';
			utter.rate = 1.0;
			utter.pitch = 1.0;
			utter.onstart = () => {
				setState(State.SPEAKING);
				try {
					if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
					// We cannot analyser speechSynthesis directly; keep visual animation passive
				} catch {}
			};
			utter.onend = () => resolve();
			utter.onerror = (e) => { console.warn('TTS error', e); resolve(); };
			window.speechSynthesis.cancel();
			window.speechSynthesis.speak(utter);
		} catch (e) { reject(e); }
	});
}

micBtn.addEventListener('click', async () => {
	if (appState === State.SPEAKING) {
		// cancel playback and requests
		abortInFlight();
		try { stopAnalyser(); } catch {}
		setState(State.IDLE);
		return;
	}
	if (appState === State.LISTENING) { stopListening(); return; }
	const stream = await requestMicPermission();
	if (!stream) {
		setState(State.DISABLED);
		disabledOverlay.hidden = false;
		return;
	}
	micStream = stream;
	startListening();
});

retryPermsBtn.addEventListener('click', async () => {
	const stream = await requestMicPermission();
	if (stream) {
		disabledOverlay.hidden = true;
		setState(State.IDLE);
	}
});

// PWA: register service worker
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(() => {});
	});
}

// Toggle streaming mode here; for demo we use streaming
const USE_STREAMING = true;

// Bind push-to-talk
bindPushToTalk();

// Init
setState(State.IDLE);