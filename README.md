# AI Therapist - Voice-Only Wellness Companion

A Next.js 14 voice-only AI therapist prototype with ChatGPT-style animated sphere interface. Built with TypeScript, Tailwind CSS, Groq API, and ElevenLabs TTS.

## ⚠️ Disclaimer

**This is a wellness prototype, not therapy. If in crisis, seek professional help.**

## 🎯 Features

### Voice-Only Interface

- **Tap-to-speak** - Click the animated sphere to start voice recording
- **Speech-to-text** - Web Speech API converts voice to text
- **Text-to-speech** - ElevenLabs generates natural voice responses
- **No text display** - Pure voice conversation like ChatGPT mobile

### Animated Sphere

- **ChatGPT-style animations** - Organic morphing sphere with Framer Motion
- **State-based colors** - Gray (idle), Red (listening), Yellow (thinking), Blue (speaking)
- **Particle effects** - Floating particles during voice activity
- **Glow effects** - Dynamic outer glow that expands during activity

### AI Integration

- **Groq API** - Fast streaming responses with llama-3.1-8b-instant
- **ElevenLabs TTS** - High-quality voice synthesis
- **Crisis detection** - Client-side keyword detection with safety alerts
- **Optimized responses** - Early TTS start for faster perceived response times

### Mobile-First Design

- **Responsive sphere** - Scales from 64x64 (mobile) to 80x80 (desktop)
- **Touch-friendly** - Large clickable area with hover/press feedback
- **Smooth audio** - Mobile Safari and Chrome compatible
- **Full-screen interface** - Minimal, distraction-free design

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Groq API key ([console.groq.com](https://console.groq.com))
- ElevenLabs API key ([elevenlabs.io](https://elevenlabs.io))

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Abdalkaderdev/App.git
   cd App
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local`:

   ```
   GROQ_API_KEY=your_groq_api_key_here
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   ELEVENLABS_VOICE_ID=your_voice_id_here
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

1. **Allow microphone access** when prompted
2. **Tap the sphere** to start recording your voice
3. **Speak your wellness question** or concern
4. **Listen to the AI response** - the sphere will animate while speaking
5. **Continue the conversation** by tapping the sphere again

## 🏗️ Architecture

### Frontend (`/app/page.tsx`)

- Voice-only interface with animated sphere
- Web Speech API for speech recognition
- Audio playback with state management
- Crisis keyword detection

### API Routes

- `/api/chat` - Groq streaming chat completions
- `/api/tts` - ElevenLabs text-to-speech conversion

### Components

- `AnimatedSphere.tsx` - Framer Motion animated sphere
- `VoiceWave.tsx` - Audio visualization bars (legacy)

### Libraries Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Groq SDK** - AI chat completions
- **Zod** - API validation

## 🔧 Configuration

### System Prompt

The AI uses a concise wellness-focused prompt:

```
"You are a supportive wellness companion. Give brief, kind replies (2-4 sentences). Focus on grounding and mindfulness. If crisis mentioned, urge emergency services."
```

### Response Optimization

- **Max tokens**: 150 (for faster responses)
- **Temperature**: 0.7 (balanced creativity/consistency)
- **Early TTS**: Starts after 50 characters for perceived speed

### Crisis Keywords

Client-side detection for: `suicide`, `kill myself`, `self-harm`, `end my life`

## 🚀 Deployment

### Build for production

```bash
npm run build
npm run start
```

### Deploy to Vercel

1. Push your repo to GitHub (public or private)
2. Go to the Vercel dashboard and click "New Project"
3. Import this repository and select it
4. In "Environment Variables", add:
   - `GROQ_API_KEY`
   - `ELEVENLABS_API_KEY`
   - `ELEVENLABS_VOICE_ID`
5. Leave build settings as default (Framework Preset: Next.js)
6. Click "Deploy"

Notes:

- A minimal `vercel.json` is included to map secrets; you can also manage env vars solely in Vercel and delete `vercel.json` if preferred.
- For Preview Environments (PRs), add the same env vars under Preview scope.
- After deploy, use "View Logs" in Vercel to troubleshoot any runtime issues.

## 🧪 Testing

Run unit tests:

```bash
npm test
```

Run E2E tests locally:

```bash
npx playwright install
npm run test:e2e
```

## 📱 Mobile Support

- **iOS Safari** - Full voice support with autoplay handling
- **Android Chrome** - Optimized touch interactions
- **Responsive design** - Adapts to all screen sizes
- **PWA ready** - Can be installed as app

## 🔒 Privacy & Safety

- **No data storage** - Conversations are not saved
- **Crisis detection** - Automatic alerts for concerning keywords
- **Emergency guidance** - Directs users to professional help when needed
- **Disclaimer** - Clear messaging about prototype limitations

## 🛠️ Development

### Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── chat/route.ts      # Groq streaming API
│   │   └── tts/route.ts       # ElevenLabs TTS API
│   ├── page.tsx               # Main voice interface
│   └── layout.tsx             # App layout
├── components/
│   ├── AnimatedSphere.tsx     # Main sphere component
│   └── VoiceWave.tsx          # Audio visualization
└── lib/
    ├── crisis-detector.ts     # Safety keyword detection
    └── stream.ts              # SSE streaming utilities
```

### Key Features Implemented

- ✅ Voice-only interface (no text chat)
- ✅ ChatGPT-style animated sphere
- ✅ Fast streaming responses
- ✅ Early TTS for perceived speed
- ✅ Mobile-optimized design
- ✅ Crisis safety detection
- ✅ Framer Motion animations
- ✅ ElevenLabs voice synthesis
- ✅ Groq AI integration

## 📄 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues or questions:

- Open a GitHub issue
- Check the console for error messages
- Ensure API keys are correctly configured

---

**Built with ❤️ for mental wellness and AI innovation**
