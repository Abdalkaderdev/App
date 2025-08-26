## Voice Bubble Prototype

Minimal, production-minded voice-only bubble: user taps mic, speaks, and hears an AI reply — no text UI. Mobile-first, works on desktop.

### Quick start

```bash
# install deps
npm install

# start server (set ElevenLabs to enable real TTS)
ELEVENLABS_API_KEY=YOUR_KEY ELEVENLABS_VOICE_ID=YOUR_VOICE npm start
# open
# http://localhost:3000
```

- To restrict CORS to a single origin, set `CORS_ORIGIN=https://your.site`.
- ElevenLabs is optional; without it the client falls back to `speechSynthesis`.

### Environment variables

- ELEVENLABS_API_KEY: ElevenLabs API key
- ELEVENLABS_VOICE_ID: Default ElevenLabs voice id
- CORS_ORIGIN: Optional allowed origin for CORS (otherwise same-origin only)
- PORT: Optional server port (default 3000)

### Endpoints

- POST `/api/chat`
  - Request: `{ "messages": [{ "role": "user", "content": string }] }`
  - Response: `{ "text": string }`

- GET `/api/chat/stream?content=...`
  - Server-Sent Events (SSE) streaming of `{ text: string }` chunks
  - Final event: `data: [DONE]`

- POST `/api/tts`
  - Request: `{ "text": string, "voiceId"?: string }`
  - Response: `audio/mpeg` (streams ElevenLabs audio)

Health:

```bash
curl -s http://localhost:3000/healthz
```

### What’s implemented

- Voice-only sphere UI with states: idle, listening, processing, speaking, error, disabled
- Web Speech API STT with 30s auto-stop; client safety keyword check and warning
- Two reply modes
  - Non-streaming: waits for `/api/chat` text, then `/api/tts`
  - Streaming: SSE `/api/chat/stream` sentence chunks → TTS queue per sentence
- TTS
  - ElevenLabs proxy via `/api/tts` (streams `audio/mpeg`)
  - Fallback to `speechSynthesis` if TTS fails
- Audio & visuals
  - Web Audio analyser drives VoiceWave for mic and playback
  - iOS/WebAudio unlock on first gesture
- Controls & UX
  - Push-to-talk: press/hold mic; release to stop
  - VAD: simple RMS-based silence detection to auto-stop while listening
  - Keyboard: Space = push-to-talk; release stops
  - Haptics: subtle vibrations on transitions
  - Reduced motion: respects `prefers-reduced-motion`
  - Mobile-first large touch targets
- Security & deploy-minded bits
  - `helmet` security headers, optional restricted CORS, rate limiting for `/api/*`
  - PWA manifest + service worker caching shell/assets

### Project layout

- `server.js` — Express server, `/api` endpoints, static hosting (`public/`)
- `public/` — vanilla client: `index.html`, `styles.css`, `app.js`, `sw.js`, `manifest.webmanifest`
- `src/components/VoiceSphere.tsx` — self-contained React component version

### React component: VoiceSphere

Usage:

```tsx
import VoiceSphere from './src/components/VoiceSphere';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#0f172a' }}>
      <VoiceSphere
        apiBaseUrl="/api"
        voiceId={process.env.NEXT_PUBLIC_ELEVENLABS_VOICE_ID}
        lang="en-US"
        maxRecordMs={30000}
        useStreaming={true}
        enableHaptics={true}
        enablePushToTalk={true}
        enableVAD={true}
        enableKeyboardShortcuts={true}
        onStartListening={() => {}}
        onStopListening={(t) => {}}
        onStartSpeaking={() => {}}
        onStopSpeaking={() => {}}
        onError={(e) => { console.error(e); }}
      />
    </div>
  );
}
```

Props:

- apiBaseUrl?: string — default "/api"
- voiceId?: string — optional ElevenLabs voice
- lang?: string — default "en-US" for STT/TTS
- maxRecordMs?: number — default 30000
- useStreaming?: boolean — default true (SSE and sentence-level TTS queue)
- enableHaptics?: boolean — default true
- enablePushToTalk?: boolean — default true (press/hold on button)
- enableVAD?: boolean — default true (silence auto-stop)
- enableKeyboardShortcuts?: boolean — default true (Space to PTT)
- onError?: (err) => void
- onStartListening?: () => void
- onStopListening?: (transcript: string) => void
- onStartSpeaking?: () => void
- onStopSpeaking?: () => void

### Notes and limitations

- Web Speech API availability varies by browser; fallback flows are basic.
- VAD is a lightweight RMS heuristic; tune thresholds for your environment.
- `speechSynthesis` voices and behavior vary by OS/browser.
- For true low-latency TTS streaming, consider MSE or provider-side chunked audio.

### Common cURL tests

```bash
# Chat (non-streaming)
curl -sS -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' \
  -d '{ "messages": [{ "role":"user", "content":"hello there" }] }'

# Chat (streaming)
curl -N "http://localhost:3000/api/chat/stream?content=hello%20there"

# TTS to file (default voice)
curl -sS -X POST http://localhost:3000/api/tts \
  -H 'Content-Type: application/json' \
  -d '{ "text": "Hello from ElevenLabs." }' \
  -o reply.mp3

# TTS with voice override
curl -sS -X POST http://localhost:3000/api/tts \
  -H 'Content-Type: application/json' \
  -d '{ "text": "Using a different voice.", "voiceId": "VOICE_ID_HERE" }' \
  -o reply.mp3
```
