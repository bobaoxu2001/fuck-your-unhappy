"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SoundType = "slap" | "punch" | "roast" | "rage" | "victory";

export interface UseSoundReturn {
  /** Play a synthesized sound effect (no asset files). */
  play: (type: SoundType) => void;
  /** Whether SFX + haptics are enabled (persisted in localStorage). */
  soundEnabled: boolean;
  /** Toggle SFX on/off and persist. */
  setSoundEnabled: (v: boolean) => void;
  /** True when the Web Audio API is available. */
  isSupported: boolean;
}

type WindowWithWebkit = Window &
  typeof globalThis & { webkitAudioContext?: typeof AudioContext };

interface ToneOpts {
  freq: number;
  type?: OscillatorType;
  dur: number;
  peak?: number;
  end?: number;
  delay?: number;
}

interface NoiseOpts {
  dur: number;
  filter?: BiquadFilterType;
  freq?: number;
  peak?: number;
  delay?: number;
}

function vibrate(pattern: number | number[]) {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* some browsers throw if called without a user gesture — ignore */
  }
}

export function useSound(): UseSoundReturn {
  const isSupported =
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem("fyu-sound-enabled");
    return stored === null ? true : stored === "true";
  });

  const enabledRef = useRef(soundEnabled);
  useEffect(() => {
    enabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!isSupported) return null;
    if (!ctxRef.current) {
      const w = window as WindowWithWebkit;
      const Ctor = w.AudioContext ?? w.webkitAudioContext;
      if (!Ctor) return null;
      ctxRef.current = new Ctor();
    }
    if (ctxRef.current.state === "suspended") {
      void ctxRef.current.resume();
    }
    return ctxRef.current;
  }, [isSupported]);

  const play = useCallback(
    (type: SoundType) => {
      if (!enabledRef.current) return;
      const ctx = getCtx();
      if (!ctx) return;

      const master = ctx.createGain();
      master.gain.value = 0.26;
      master.connect(ctx.destination);

      const tone = ({ freq, type: wave = "sine", dur, peak = 0.3, end = freq, delay = 0 }: ToneOpts) => {
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(freq, t0);
        if (end !== freq) {
          osc.frequency.exponentialRampToValueAtTime(Math.max(1, end), t0 + dur);
        }
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(t0);
        osc.stop(t0 + dur + 0.03);
      };

      const noise = ({ dur, filter = "highpass", freq = 1000, peak = 0.3, delay = 0 }: NoiseOpts) => {
        const t0 = ctx.currentTime + delay;
        const frames = Math.max(1, Math.floor(ctx.sampleRate * dur));
        const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const f = ctx.createBiquadFilter();
        f.type = filter;
        f.frequency.value = freq;
        const g = ctx.createGain();
        g.gain.setValueAtTime(peak, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(f);
        f.connect(g);
        g.connect(master);
        src.start(t0);
        src.stop(t0 + dur + 0.03);
      };

      switch (type) {
        case "slap":
          noise({ dur: 0.13, filter: "highpass", freq: 1800, peak: 0.4 });
          tone({ freq: 420, end: 180, type: "triangle", dur: 0.1, peak: 0.18 });
          vibrate(18);
          break;
        case "punch":
          tone({ freq: 170, end: 48, type: "sine", dur: 0.24, peak: 0.55 });
          noise({ dur: 0.09, filter: "lowpass", freq: 420, peak: 0.32 });
          vibrate(34);
          break;
        case "roast":
          tone({ freq: 300, end: 950, type: "sawtooth", dur: 0.2, peak: 0.2 });
          vibrate([8, 24, 8]);
          break;
        case "rage":
          tone({ freq: 120, end: 620, type: "sawtooth", dur: 0.42, peak: 0.3 });
          tone({ freq: 240, end: 1240, type: "square", dur: 0.42, peak: 0.12 });
          vibrate([38, 28, 60]);
          break;
        case "victory": {
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((f, i) =>
            tone({ freq: f, type: "triangle", dur: 0.26, peak: 0.32, delay: i * 0.12 }),
          );
          vibrate([28, 40, 28, 40, 90]);
          break;
        }
      }
    },
    [getCtx],
  );

  const setSoundEnabled = useCallback((v: boolean) => {
    enabledRef.current = v;
    setSoundEnabledState(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("fyu-sound-enabled", String(v));
    }
  }, []);

  return { play, soundEnabled, setSoundEnabled, isSupported };
}
