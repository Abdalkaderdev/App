export type ListenResult = {
  transcript: string;
};

type RecognitionResultEvent = {
  results?: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type RecognitionErrorEvent = {
  error?: string;
};

type WebSpeechRecognition = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => WebSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export async function listenOnce(options?: { lang?: string }): Promise<ListenResult> {
  if (typeof window === "undefined") {
    throw new Error("Speech recognition is only available in the browser");
  }
  const RecognitionCtor: SpeechRecognitionConstructor | undefined =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!RecognitionCtor) {
    throw new Error("SpeechRecognition is not supported in this browser");
  }
  const recognition: WebSpeechRecognition = new RecognitionCtor();
  recognition.lang = options?.lang ?? "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  return new Promise<ListenResult>((resolve, reject) => {
    const cleanup = () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
    };

    recognition.onresult = (event) => {
      const first =
        (event.results?.[0]?.[0] as { transcript?: string } | undefined)?.transcript ?? "";
      cleanup();
      resolve({ transcript: first });
    };

    recognition.onerror = (event) => {
      cleanup();
      reject(new Error(event?.error ?? "speech recognition error"));
    };

    recognition.onend = () => {
      // Swallow; resolution handled in onresult/onerror
    };

    try {
      recognition.start();
    } catch (err) {
      reject(err as Error);
    }
  });
}

export async function speak(
  text: string,
  options?: { lang?: string; rate?: number; pitch?: number; voiceName?: string },
): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  return new Promise<void>((resolve) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? "en-US";
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    if (options?.voiceName) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.name === options.voiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = () => resolve();
    window.speechSynthesis.speak(utterance);
  });
}
