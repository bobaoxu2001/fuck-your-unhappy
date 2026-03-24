"use client";

import { motion } from "framer-motion";
import { ReleaseSummaryData } from "@/lib/types";

interface ReleaseSummaryProps {
  data: ReleaseSummaryData;
  onRestart: () => void;
}

const statCard = (label: string, value: string, color: string, delay: number) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="bg-white rounded-2xl p-4 shadow-md flex flex-col items-center gap-1"
  >
    <span className="text-2xl font-black" style={{ color }}>
      {value}
    </span>
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
      {label}
    </span>
  </motion.div>
);

export default function ReleaseSummary({ data, onRestart }: ReleaseSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4 text-center"
    >
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.1 }}
        className="text-7xl"
      >
        {data.emoji}
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black tracking-tight text-gray-800"
      >
        {data.headline}
      </motion.h1>

      {/* Roast line */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="italic text-gray-500 text-sm px-2"
      >
        &ldquo;{data.roastLine}&rdquo;
      </motion.p>

      {/* Stat cards grid */}
      <div className="w-full grid grid-cols-2 gap-3">
        {statCard("Total Hits", String(data.hitCount), "#EF4444", 0.5)}
        {statCard("Best Combo", `${data.bestCombo}x`, "#F59E0B", 0.6)}
        {statCard("Stress Reduced", `${data.stressReduced}%`, "#10B981", 0.7)}
        {statCard("Rage Level", "0", "#8B5CF6", 0.8)}
      </div>

      {/* Buttons */}
      <div className="w-full flex flex-col gap-3 mt-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="w-full py-4 rounded-2xl bg-purple-500 text-white text-lg font-bold shadow-md"
        >
          Bash Another Boss
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {}}
          className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 text-sm font-semibold"
        >
          Share My Victory (coming soon)
        </motion.button>
      </div>
    </motion.div>
  );
}
