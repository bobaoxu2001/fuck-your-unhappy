"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import StressSlider from "@/components/StressSlider";
import { useSound } from "@/hooks/useSound";

interface CooldownProps {
  stressBefore: number;
  onComplete: (stressAfter: number) => void;
}

// Calming pattern: longer exhale than inhale helps the nervous system settle.
const PHASES = [
  { label: "Breathe in", hint: "through your nose", dur: 4, scale: 1 },
  { label: "Hold", hint: "stay with it", dur: 4, scale: 1 },
  { label: "Breathe out", hint: "slowly, let go", dur: 6, scale: 0.55 },
] as const;
const CYCLES = 3;

export default function Cooldown({ stressBefore, onComplete }: CooldownProps) {
  const [stage, setStage] = useState<"breathing" | "reflect">("breathing");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [cycle, setCycle] = useState(1);
  const [after, setAfter] = useState(() => Math.max(0, stressBefore - 30));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { startAmbient, stopAmbient, isSupported: soundSupported } = useSound();
  const [noiseOn, setNoiseOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("fyu-noise-enabled") === "true";
  });

  // Auto-start ambience if the user previously enabled it (a prior battle tap
  // already unlocked audio, so this won't be blocked by autoplay policy).
  useEffect(() => {
    if (noiseOn) startAmbient();
    return () => stopAmbient();
  }, [noiseOn, startAmbient, stopAmbient]);

  const toggleNoise = () => {
    setNoiseOn((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("fyu-noise-enabled", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (stage !== "breathing") return;
    const phase = PHASES[phaseIdx];
    timerRef.current = setTimeout(() => {
      if (phaseIdx < PHASES.length - 1) {
        setPhaseIdx((i) => i + 1);
      } else if (cycle < CYCLES) {
        setCycle((c) => c + 1);
        setPhaseIdx(0);
      } else {
        setStage("reflect");
      }
    }, phase.dur * 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [stage, phaseIdx, cycle]);

  const phase = PHASES[phaseIdx];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-xl flex-col items-center gap-5 px-2 text-center"
    >
      <AnimatePresence mode="wait">
        {stage === "breathing" ? (
          <motion.div
            key="breathing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex w-full flex-col items-center gap-5"
          >
            <div className="flex flex-col items-center gap-1">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">
                Cool down
              </p>
              <h2 className="font-display text-4xl tracking-wide text-black md:text-5xl">
                Take a breath. You earned it.
              </h2>
              <p className="text-sm font-semibold text-gray-500">
                Smashing let it out — now let your body actually settle.
              </p>
            </div>

            {/* Breathing circle */}
            <div className="relative flex h-64 w-64 items-center justify-center md:h-72 md:w-72">
              <motion.div
                className="breathe-aura absolute h-44 w-44 rounded-full md:h-52 md:w-52"
                initial={{ scale: 0.55 }}
                animate={{ scale: phase.scale }}
                transition={{ duration: phase.dur, ease: "easeInOut" }}
              />
              <div className="relative z-10 flex flex-col items-center text-white drop-shadow">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={`${cycle}-${phaseIdx}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-2xl tracking-wide md:text-3xl"
                  >
                    {phase.label}
                  </motion.span>
                </AnimatePresence>
                <span className="mt-1 text-[11px] font-semibold uppercase tracking-widest opacity-90">
                  {phase.hint}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: CYCLES }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i < cycle ? "bg-brand-purple" : "bg-gray-200"
                  }`}
                />
              ))}
              <span className="ml-2 text-[11px] font-black uppercase tracking-widest text-gray-400">
                Breath {cycle} / {CYCLES}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {soundSupported && (
                <button
                  onClick={toggleNoise}
                  aria-pressed={noiseOn}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-widest transition-all ${
                    noiseOn
                      ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                      : "border-gray-200 bg-white text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <span>{noiseOn ? "🌊" : "🔈"}</span>
                  {noiseOn ? "White noise on" : "White noise"}
                </button>
              )}
              <button
                onClick={() => setStage("reflect")}
                className="text-[11px] font-bold uppercase tracking-widest text-gray-400 underline-offset-4 hover:text-gray-600 hover:underline"
              >
                Skip breathing
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reflect"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex w-full flex-col items-center gap-5"
          >
            <div className="flex flex-col items-center gap-1">
              <span className="text-5xl">🫧</span>
              <h2 className="font-display text-4xl tracking-wide text-black md:text-5xl">
                How&apos;s your stress now?
              </h2>
              <p className="text-sm font-semibold text-gray-500">
                Be honest — this is just for you.
              </p>
            </div>

            <div className="w-full rounded-[2rem] bg-white/90 p-6 shadow-xl ring-1 ring-black/5">
              <div className="mb-4 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <span>Before</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 tabular-nums">
                  {stressBefore}%
                </span>
              </div>
              <StressSlider value={after} onChange={setAfter} ariaLabel="Stress level now" />
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => onComplete(after)}
              className="btn-3d btn-yellow w-full rounded-2xl py-4 text-lg font-black uppercase tracking-wide text-black"
            >
              See My Release →
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
