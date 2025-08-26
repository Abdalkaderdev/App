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

function setState(next) {
	appState = next;
	sphere.classList.remove('state-idle','state-listening','state-processing','state-speaking');
	switch (next) {
		case State.IDLE:
			sphere.classList.add('state-idle');
			micBtn.disabled = false;
			micBtn.setAttribute('aria-pressed', 'false');
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
	// Best-effort: getUserMedia for permission prompt
	try {
		await navigator.mediaDevices.getUserMedia({ audio: true });
		return true;
	} catch (e) {
		return false;
	}
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
		recognition.onstart = () => {
			recognitionActive = true;
			setState(State.LISTENING);
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

async function handleTranscript(transcript) {
	const trimmed = (transcript || '').trim();
	if (!trimmed) {
		setState(State.IDLE);
		showToast('Heard nothing. Tap mic to try again.');
		return;
	}

	if (crisisKeywordCheck(trimmed)) {
		alert('If you are in crisis or considering self-harm, please seek immediate help from local emergency services or a trusted person. You are not alone.');
	}

	setState(State.PROCESSING);
	try {
		const chatRes = await fetch('/api/chat', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ messages: [{ role: 'user', content: trimmed }] })
		});
		if (!chatRes.ok) throw new Error('chat failed');
		const { text } = await chatRes.json();

		// Call TTS endpoint (MVP stub)
		await fetch('/api/tts', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text })
		});

		await speak(text);
		setState(State.IDLE);
	} catch (e) {
		console.error('processing error', e);
		setState(State.ERROR);
		showToast('Error occurred. Tap mic to retry.');
	}
}

function speak(text) {
	return new Promise((resolve, reject) => {
		try {
			const utter = new SpeechSynthesisUtterance(text);
			utter.lang = 'en-US';
			utter.rate = 1.0;
			utter.pitch = 1.0;
			utter.onstart = () => setState(State.SPEAKING);
			utter.onend = () => resolve();
			utter.onerror = (e) => {
				console.warn('TTS error', e);
				resolve();
			};
			window.speechSynthesis.cancel();
			window.speechSynthesis.speak(utter);
		} catch (e) {
			reject(e);
		}
	});
}

micBtn.addEventListener('click', async () => {
	if (appState === State.SPEAKING) return;
	if (appState === State.LISTENING) { stopListening(); return; }
	const granted = await requestMicPermission();
	if (!granted) {
		setState(State.DISABLED);
		disabledOverlay.hidden = false;
		return;
	}
	startListening();
});

retryPermsBtn.addEventListener('click', async () => {
	const granted = await requestMicPermission();
	if (granted) {
		disabledOverlay.hidden = true;
		setState(State.IDLE);
	}
});

// Init
setState(State.IDLE);