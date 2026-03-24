"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MonsterData } from "@/lib/types";

interface VentArenaProps {
  monster: MonsterData;
  onFinish: (hitCount: number, bestCombo: number) => void;
}

const COMIC_WORDS = ["BOOM", "POW", "SLAP", "TAKE THAT", "WHAM", "CRACK", "BAM", "OOF"];
const COMBO_WORDS = ["NICE!", "COMBO!", "UNSTOPPABLE!", "BEAST MODE!", "GODLIKE!"];
const COMBO_TIMEOUT_MS = 800;
const FLOAT_DURATION_MS = 700;
const STICKER_COLORS = ["#EF4444", "#FFD600", "#7C3AED", "#FF1493", "#06B6D4"];

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function VentArena({ monster, onFinish }: VentArenaProps) {
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [squash, setSquash] = useState(false);

  const bestComboRef = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatIdRef = useRef(0);

  const stressLevel = Math.min(100, Math.round(hits * 4.5));

  const spawnFloat = useCallback((isCombo: boolean) => {
    const id = ++floatIdRef.current;
    const text = pickRandom(isCombo ? COMBO_WORDS : COMIC_WORDS);
    const color = isCombo ? "#FFD600" : pickRandom(STICKER_COLORS);

    setFloats((prev) => [
      ...prev.slice(-5),
      { id, text, x: -40 + Math.random() * 80, y: -20 + Math.random() * 40, color },
    ]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), FLOAT_DURATION_MS);
  }, []);

  const handleTap = () => {
    setHits((h) => h + 1);
    setSquash(true);
    setTimeout(() => setSquash(false), 150);

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);

    setCombo((c) => {
      const next = c + 1;
      if (next > bestComboRef.current) bestComboRef.current = next;
      spawnFloat(next > 1 && next % 3 === 0);
      return next;
    });

    comboTimerRef.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT_MS);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto px-3">
      {/* Stress Level Bar */}
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-gray-500">
              Stress Level
            </span>
            {stressLevel > 60 && (
              <span className="text-[10px] font-black uppercase tracking-wide text-brand-red bg-red-50 px-2 py-0.5 rounded-full">
                Critical Stress Detected
              </span>
            )}
          </div>
          <span className="text-lg font-black text-brand-purple">{stressLevel}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            animate={{ width: `${stressLevel}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full stress-bar-gradient"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Hits</span>
            <span className="text-base font-black text-brand-red">{hits}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white rounded-xl px-3 py-1.5 shadow-sm border border-gray-100">
            <span className="text-xs font-bold text-gray-400 uppercase">Combo</span>
            <span
              className="text-base font-black"
              style={{ color: combo > 2 ? "#FFD600" : "#9CA3AF" }}
            >
              {combo}x
            </span>
          </div>
        </div>
        {combo >= 3 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="comic-sticker bg-brand-yellow text-black text-xs"
            style={{ ["--sticker-rotate" as string]: "-3deg" }}
          >
            x{combo} COMBO
          </motion.div>
        )}
      </div>

      {/* Monster Tap Area */}
      <div className="relative flex items-center justify-center w-full h-56">
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 0.5, x: f.x }}
              animate={{ opacity: 0, y: -80 + f.y, scale: 1.2, x: f.x }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-4 pointer-events-none select-none z-10"
            >
              <span
                className="comic-sticker text-white text-sm"
                style={{
                  backgroundColor: f.color,
                  color: f.color === "#FFD600" ? "#000" : "#fff",
                  ["--sticker-rotate" as string]: `${-6 + Math.random() * 12}deg`,
                }}
              >
                {f.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          onClick={handleTap}
          animate={
            squash
              ? { scaleX: 1.2, scaleY: 0.8, rotate: Math.random() > 0.5 ? 6 : -6 }
              : { scaleX: 1, scaleY: 1, rotate: 0 }
          }
          transition={{ type: "spring", stiffness: 600, damping: 12 }}
          className="text-8xl select-none cursor-pointer active:scale-90 transition-none drop-shadow-lg"
        >
          {monster.emoji}
        </motion.button>

        {hits > 0 && hits % 5 === 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 font-display text-2xl text-brand-red tracking-wider"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.1)" }}
          >
            EMOTIONAL DAMAGE!
          </motion.div>
        )}
      </div>

      {/* Monster Name */}
      <p className="text-sm font-black uppercase tracking-wider text-gray-400">
        {monster.name}
      </p>

      {/* Progress hint */}
      {stressLevel < 100 && hits > 0 && (
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
          {100 - stressLevel}% until complete breakdown!
        </p>
      )}

      {/* Finish Button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onFinish(hits, bestComboRef.current)}
        className="w-full py-3.5 rounded-2xl bg-brand-yellow text-black text-lg font-black uppercase tracking-wide shadow-md border-2 border-black/5 mt-1"
      >
        {hits === 0 ? "Skip" : "I'm Done 😌"}
      </motion.button>
    </div>
  );
}
