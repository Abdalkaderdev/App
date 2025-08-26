import express from 'express';
import compression from 'compression';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// Healthcheck
app.get('/healthz', (_req, res) => {
	res.status(200).json({ ok: true });
});

// Simple chat stub: echoes supportive style
app.post('/api/chat', async (req, res) => {
	try {
		const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
		const userMsg = messages.find(m => m?.role === 'user')?.content ?? '';
		// Simple, friendly reflective response
		const reply = userMsg
			? `I hear you. ${userMsg}. Thank you for sharing that. Would you like to talk more about how that makes you feel right now?`
			: 'Hello. I am here to listen. What is on your mind?';
		// Simulate minimal processing latency
		await new Promise(r => setTimeout(r, 400));
		res.status(200).json({ text: reply });
	} catch (err) {
		console.error('POST /api/chat error', err);
		res.status(500).json({ error: 'Server error' });
	}
});

// TTS stub: For MVP we let client use speechSynthesis; this endpoint acknowledges receipt
app.post('/api/tts', async (req, res) => {
	try {
		const text = req.body?.text ?? '';
		if (!text) {
			return res.status(400).json({ error: 'text is required' });
		}
		// In a real impl, generate audio and stream it.
		await new Promise(r => setTimeout(r, 100));
		res.status(204).end();
	} catch (err) {
		console.error('POST /api/tts error', err);
		res.status(500).json({ error: 'Server error' });
	}
});

app.use(express.static('public', { index: 'index.html' }));

app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});