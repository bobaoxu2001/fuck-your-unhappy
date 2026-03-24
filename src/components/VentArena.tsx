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
const COMBO_TIMEOUT = 800;

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

let floatId = 0;

export default function VentArena({ monster, onFinish }: VentArenaProps) {
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [squash, setSquash] = useState(false);
  const comboTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spawnFloat = useCallback((isCombo: boolean) => {
    const text = isCombo
      ? COMBO_WORDS[Math.min(Math.floor(Math.random() * COMBO_WORDS.length), COMBO_WORDS.length - 1)]
      : COMIC_WORDS[Math.floor(Math.random() * COMIC_WORDS.length)];
    const x = -40 + Math.random() * 80;
    const y = -20 + Math.random() * 40;
    const color = isCombo ? "#F59E0B" : monster.color;
    const id = ++floatId;

    setFloats((prev) => [...prev.slice(-5), { id, text, x, y, color }]);
    setTimeout(() => {
      setFloats((prev) => prev.filter((f) => f.id !== id));
    }, 700);
  }, [monster.color]);

  const handleTap = () => {
    setHits((h) => h + 1);

    // Squash animation
    setSquash(true);
    setTimeout(() => setSquash(false), 150);

    // Combo logic
    if (comboTimer.current) clearTimeout(comboTimer.current);
    setCombo((c) => {
      const next = c + 1;
      if (next > bestCombo) setBestCombo(next);
      if (next > 1 && next % 3 === 0) {
        spawnFloat(true);
      } else {
        spawnFloat(false);
      }
      return next;
    });
    comboTimer.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-4">
      {/* Header */}
      <h2 className="text-lg font-bold text-center text-gray-700">
        Smash it! 👊
      </h2>

      {/* Stats row */}
      <div className="flex w-full justify-between text-sm font-semibold">
        <span className="text-gray-500">Hits: <span className="text-red-500">{hits}</span></span>
        <span className="text-gray-500">
          Combo: <span style={{ color: combo > 2 ? "#F59E0B" : "#6B7280" }}>{combo}x</span>
        </span>
      </div>

      {/* Monster tap area */}
      <div className="relative flex items-center justify-center w-64 h-64">
        {/* Floating comic text */}
        <AnimatePresence>
          {floats.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 0.5, x: f.x }}
              animate={{ opacity: 0, y: -80 + f.y, scale: 1.3, x: f.x }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-4 font-black text-2xl pointer-events-none select-none"
              style={{
                color: f.color,
                textShadow: "0 2px 4px rgba(0,0,0,0.15)",
                WebkitTextStroke: "1px rgba(0,0,0,0.1)",
              }}
            >
              {f.text}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Monster */}
        <motion.button
          onClick={handleTap}
          animate={
            squash
              ? { scaleX: 1.2, scaleY: 0.8, rotate: Math.random() > 0.5 ? 6 : -6 }
              : { scaleX: 1, scaleY: 1, rotate: 0 }
          }
          transition={{ type: "spring", stiffness: 600, damping: 12 }}
          className="text-8xl select-none cursor-pointer active:scale-90 transition-none"
        >
          {monster.emoji}
        </motion.button>
      </div>

      {/* Monster name */}
      <p className="text-sm font-semibold text-gray-400">{monster.name}</p>

      {/* Finish button */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onFinish(hits, bestCombo)}
        className="w-full py-3.5 rounded-2xl bg-green-500 text-white text-lg font-bold shadow-md"
      >
        {hits === 0 ? "Skip" : "I'm Done 😌"}
      </motion.button>
    </div>
  );
}
