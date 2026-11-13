/**
 * Thin wrapper over the browser Web Speech API.
 *
 * Speech is OPTIONAL. Support varies by browser and some platforms send audio
 * to a vendor service for recognition, so the demo always offers typed input
 * and says plainly which mode is active. Nothing is recorded or uploaded by
 * this app itself.
 */

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechWindow = Window & {
  SpeechRecognition?: new () => RecognitionLike;
  webkitSpeechRecognition?: new () => RecognitionLike;
};

export type Support = { recognition: boolean; synthesis: boolean };

/** No result or error within this long means the engine is not really working. */
export const LISTEN_TIMEOUT_MS = 8000;

/**
 * The API existing is not the same as it working. Some environments expose
 * speechSynthesis with no installed voices, where speaking is silently a
 * no-op — so a voice must actually be present before we offer the option.
 */
export function detectSupport(): Support {
  if (typeof window === "undefined") return { recognition: false, synthesis: false };
  const w = window as SpeechWindow;
  const voices = window.speechSynthesis?.getVoices?.() ?? [];
  return {
    recognition: typeof (w.SpeechRecognition ?? w.webkitSpeechRecognition) === "function",
    synthesis: typeof window.speechSynthesis !== "undefined" && voices.length > 0,
  };
}

/** Voices load asynchronously in most browsers; re-check when they arrive. */
export function onVoicesReady(cb: (support: Support) => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) return () => {};
  const handler = () => cb(detectSupport());
  window.speechSynthesis.addEventListener?.("voiceschanged", handler);
  const timer = setTimeout(handler, 600);
  return () => {
    window.speechSynthesis.removeEventListener?.("voiceschanged", handler);
    clearTimeout(timer);
  };
}

export type Listener = {
  start(): void;
  stop(): void;
};

/** Returns null when the browser has no recognition engine. */
export function createListener(handlers: { onFinal: (text: string) => void; onInterim: (text: string) => void; onError: (message: string) => void; onEnd: () => void }): Listener | null {
  const w = window as SpeechWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.continuous = false;
  rec.interimResults = true;

  rec.onresult = (e) => {
    let interim = "";
    for (let i = 0; i < e.results.length; i++) {
      const result = e.results[i];
      const text = result[0]?.transcript ?? "";
      if (result.isFinal) handlers.onFinal(text.trim());
      else interim += text;
    }
    if (interim) handlers.onInterim(interim.trim());
  };
  rec.onerror = (e) => {
    const messages: Record<string, string> = {
      "not-allowed": "Microphone access was blocked. You can type instead.",
      "service-not-allowed": "This browser won't allow speech recognition here. You can type instead.",
      "no-speech": "I didn't catch anything — try again or type your answer.",
      network: "Speech recognition needs a network connection in this browser. You can type instead.",
      aborted: "",
    };
    const m = messages[e.error] ?? `Speech recognition stopped (${e.error}). You can type instead.`;
    if (m) handlers.onError(m);
  };
  rec.onend = handlers.onEnd;

  // Some environments expose the API but never return a result or an error.
  // Without this the button would sit on "listening" forever.
  let timer: ReturnType<typeof setTimeout> | null = null;
  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  const originalEnd = rec.onend;
  rec.onend = () => {
    clear();
    originalEnd?.();
  };

  return {
    start() {
      try {
        rec.start();
        timer = setTimeout(() => {
          handlers.onError("I didn't hear anything — this browser may not have a working speech engine. Typing works the same.");
          try {
            rec.stop();
          } catch {
            /* already stopped */
          }
          handlers.onEnd();
        }, LISTEN_TIMEOUT_MS);
      } catch {
        clear();
        handlers.onError("Could not start the microphone. You can type instead.");
        handlers.onEnd();
      }
    },
    stop() {
      clear();
      try {
        rec.stop();
      } catch {
        /* already stopped */
      }
    },
  };
}

/** Speaks text if the browser can, and reports whether it did. */
export function speak(text: string, enabled: boolean): boolean {
  if (!enabled || typeof window === "undefined" || !window.speechSynthesis) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\*\*/g, ""));
    u.rate = 1.03;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
    return true;
  } catch {
    return false;
  }
}

export function stopSpeaking(): void {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* nothing to cancel */
  }
}
