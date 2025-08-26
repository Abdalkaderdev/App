import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Readable } from 'node:stream';

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet({
	crossOriginResourcePolicy: { policy: 'same-origin' },
	contentSecurityPolicy: false,
}));

// JSON + compression
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// CORS: allow only configured origin if provided; otherwise same-origin only
if (process.env.CORS_ORIGIN) {
	app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: false }));
}

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	limit: 60,
	standardHeaders: true,
	legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Healthcheck
app.get('/healthz', (_req, res) => {
	res.status(200).json({ ok: true });
});

// Simple chat stub: echoes supportive style
app.post('/api/chat', async (req, res) => {
	try {
		const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
		const userMsg = messages.find(m => m?.role === 'user')?.content ?? '';
		const reply = userMsg
			? `I hear you. ${userMsg}. Thank you for sharing that. Would you like to talk more about how that makes you feel right now?`
			: 'Hello. I am here to listen. What is on your mind?';
		await new Promise(r => setTimeout(r, 400));
		res.status(200).json({ text: reply });
	} catch (err) {
		console.error('POST /api/chat error', err);
		res.status(500).json({ error: 'Server error' });
	}
});

// ElevenLabs TTS proxy: streams audio back to client
app.post('/api/tts', async (req, res) => {
	try {
		const apiKey = process.env.ELEVENLABS_API_KEY;
		const voiceId = req.body?.voiceId ?? process.env.ELEVENLABS_VOICE_ID;
		const text = req.body?.text ?? '';
		if (!text) return res.status(400).json({ error: 'text is required' });
		if (!apiKey || !voiceId) return res.status(500).json({ error: 'TTS not configured' });

		const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?optimize_streaming_latency=3`;
		const upstream = await fetch(url, {
			method: 'POST',
			headers: {
				'xi-api-key': apiKey,
				'Content-Type': 'application/json',
				'Accept': 'audio/mpeg'
			},
			body: JSON.stringify({
				text,
				model_id: 'eleven_turbo_v2',
				voice_settings: { stability: 0.5, similarity_boost: 0.75 }
			})
		});

		if (!upstream.ok || !upstream.body) {
			let detail = '';
			try { detail = await upstream.text(); } catch {}
			return res.status(502).json({ error: 'Upstream TTS failed', detail });
		}

		res.setHeader('Content-Type', 'audio/mpeg');
		res.setHeader('Cache-Control', 'no-store');
		const stream = Readable.fromWeb(upstream.body);
		stream.pipe(res);
	} catch (err) {
		console.error('POST /api/tts error', err);
		if (!res.headersSent) res.status(500).json({ error: 'Server error' });
	}
});

// Static files
app.use(express.static('public', { index: 'index.html' }));

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});