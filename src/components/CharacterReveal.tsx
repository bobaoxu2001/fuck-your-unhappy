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
      className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4"
    >
      <h2 className="text-base font-bold text-gray-500 uppercase tracking-widest">
        Your nemesis appears...
      </h2>

      {/* Monster Card */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="w-full rounded-3xl p-5 text-center shadow-xl border-4"
        style={{
          backgroundColor: monster.color + "18",
          borderColor: monster.color,
        }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-7xl leading-none"
        >
          {monster.emoji}
        </motion.div>

        <h3
          className="text-xl font-extrabold mt-2"
          style={{ color: monster.color }}
        >
          {monster.name}
        </h3>

        <p className="text-gray-600 mt-2 text-sm leading-relaxed">
          {monster.description}
        </p>

        <div
          className="mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
          style={{
            backgroundColor: monster.color + "25",
            color: monster.color,
          }}
        >
          ⚡ Weakness: {monster.weakness}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onReady}
        className="w-full py-4 rounded-2xl bg-orange-500 text-white text-xl font-bold shadow-lg"
      >
        Enter Arena 👊
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onReroll}
        className="w-full py-3 rounded-2xl border-2 border-gray-300 text-gray-500 text-base font-semibold"
      >
        🎲 Re-roll Monster
      </motion.button>
    </motion.div>
  );
}
