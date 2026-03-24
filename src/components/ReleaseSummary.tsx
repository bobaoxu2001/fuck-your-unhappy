"use client";

import { motion } from "framer-motion";
import { ReleaseSummaryData } from "@/lib/types";

interface ReleaseSummaryProps {
  data: ReleaseSummaryData;
  onRestart: () => void;
}

export default function ReleaseSummary({ data, onRestart }: ReleaseSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="flex flex-col items-center gap-5 w-full max-w-sm mx-auto px-4 text-center"
    >
      <div className="text-6xl">{data.emoji}</div>
      <h2 className="text-2xl font-bold">Emotional Release Report</h2>

      <div className="w-full bg-white rounded-2xl p-6 shadow-lg space-y-3">
        <p className="text-lg">
          You obliterated <strong>{data.monsterName}</strong>
        </p>
        <p className="text-3xl font-bold text-red-500">
          {data.hitCount} hits
        </p>
        <p className="text-gray-600">
          Stress level: <strong>{data.stressLevel}</strong>
        </p>
        <p className="italic text-gray-500 text-sm mt-2">
          &ldquo;{data.roastLine}&rdquo;
        </p>
      </div>

      <button
        onClick={onRestart}
        className="w-full py-4 rounded-2xl bg-purple-500 text-white text-xl font-bold active:scale-95 transition-transform"
      >
        Go Again 🔥
      </button>
    </motion.div>
  );
}
