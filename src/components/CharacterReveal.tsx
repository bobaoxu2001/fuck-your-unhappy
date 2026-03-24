"use client";

import { motion } from "framer-motion";
import { MonsterData } from "@/lib/types";

interface CharacterRevealProps {
  monster: MonsterData;
  onReady: () => void;
  onReroll: () => void;
}

export default function CharacterReveal({
  monster,
  onReady,
  onReroll,
}: CharacterRevealProps) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", duration: 0.8 }}
      className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto px-3"
    >
      {/* Subtitle */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-gray-200" />
        <h2 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
          Your nemesis appears
        </h2>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      {/* Monster Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="w-full rounded-2xl p-5 text-center shadow-lg border-2 bg-white relative overflow-visible"
        style={{ borderColor: monster.color }}
      >
        {/* Color accent stripe */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
          style={{ backgroundColor: monster.color }}
        />

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-7xl leading-none mt-2"
        >
          {monster.emoji}
        </motion.div>

        <h3
          className="text-xl font-black mt-3 uppercase tracking-wide"
          style={{ color: monster.color }}
        >
          {monster.name}
        </h3>

        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          {monster.description}
        </p>

        <div
          className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wide"
          style={{
            backgroundColor: monster.color + "18",
            color: monster.color,
          }}
        >
          <span>⚡</span> Weakness: {monster.weakness}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onReady}
        className="w-full py-4 rounded-2xl bg-brand-yellow text-black text-lg font-black uppercase tracking-wide shadow-md border-2 border-black/5"
      >
        Enter Arena 👊
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onReroll}
        className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-bold uppercase tracking-wide bg-white"
      >
        🎲 Re-roll Monster
      </motion.button>
    </motion.div>
  );
}
