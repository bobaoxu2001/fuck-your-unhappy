import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
export type TTSMode = "sarcastic" | "angry";

export interface UseTTSReturn {
  /** Speak text. Cancel any current speech first. */
  speak: (text: string, mode?: TTSMode) => void;
  /** Cancel speech immediately + clear pending timer. */
  stop: () => void;
  /** True when browser supports speechSynthesis. */
  isSupported: boolean;
  /** Whether voice is enabled (persisted in localStorage). */
  voiceEnabled: boolean;
  /** Toggle voice on/off and persist to localStorage. */
  setVoiceEnabled: (v: boolean) => void;
}

// ─── Voice settings per mode ──────────────────────────────────────────────────
// sarcastic: high pitch + slightly fast = annoying
// angry:     low pitch + slower = threatening (triggered when HP < 30%)
const VOICE_SETTINGS: Record<TTSMode, { rate: number; pitch: number; volume: number }> = {
  sarcastic: { rate: 1.15, pitch: 1.25, volume: 1 },
  angry:     { rate: 0.88, pitch: 0.62, volume: 1 },
};

// ─── English voice preference order ──────────────────────────────────────────
function pickEnglishVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;
  return (
    // Prefer a local US voice (avoids network latency on some platforms)
    voices.find((v) => v.lang === "en-US" && v.localService) ??
    // Any US voice
    voices.find((v) => v.lang === "en-US") ??
    // Any English voice
    voices.find((v) => v.lang.startsWith("en")) ??
    // Last resort: whatever is available
    voices[0] ??
    null
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useTTS(): UseTTSReturn {
  // ── Support detection (safe for SSR) ──────────────────────────────────────
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  // ── Persistent voice toggle ───────────────────────────────────────────────
  // Read localStorage once on mount; default ON so first-time users hear it.
  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("fyu-tts-enabled");
    return stored === null ? true : stored === "true";
  });

  // Use a ref so callbacks can read the current value without re-creating.
  const voiceEnabledRef = useRef(voiceEnabled);
  useEffect(() => { voiceEnabledRef.current = voiceEnabled; }, [voiceEnabled]);

  // ── Pending speak timer ───────────────────────────────────────────────────
  const pendingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── stop ─────────────────────────────────────────────────────────────────
  const stop = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    if (isSupported) {
      window.speechSynthesis.cancel();
    }
  }, [isSupported]);

  // ── speak ─────────────────────────────────────────────────────────────────
  const speak = useCallback(
    (text: string, mode: TTSMode = "sarcastic") => {
      if (!isSupported || !voiceEnabledRef.current) return;

      // Cancel whatever is playing right now
      stop();

      // Small synchronisation buffer — lets the speech bubble appear first
      // (caller already wraps in their own setTimeout, so this is kept at 0
      //  to avoid double-delay. Adjust if needed.)
      pendingTimerRef.current = setTimeout(() => {
        if (!voiceEnabledRef.current) return;

        const utterance = new SpeechSynthesisUtterance(text);

        // Best-effort English voice — voices may not be loaded yet on first
        // call (Chrome loads them async). If null, browser uses its default.
        const voice = pickEnglishVoice();
        if (voice) utterance.voice = voice;

        const { rate, pitch, volume } = VOICE_SETTINGS[mode];
        utterance.rate   = rate;
        utterance.pitch  = pitch;
        utterance.volume = volume;

        window.speechSynthesis.speak(utterance);
      }, 0);
    },
    [isSupported, stop],
  );

  // ── setVoiceEnabled ───────────────────────────────────────────────────────
  const setVoiceEnabled = useCallback(
    (v: boolean) => {
      voiceEnabledRef.current = v;
      setVoiceEnabledState(v);
      localStorage.setItem("fyu-tts-enabled", String(v));
      // Silence immediately when toggling off
      if (!v) stop();
    },
    [stop],
  );

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => () => stop(), [stop]);

  return { speak, stop, isSupported, voiceEnabled, setVoiceEnabled };
}
