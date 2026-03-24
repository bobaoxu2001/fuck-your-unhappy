"use client";

import { motion } from "framer-motion";
import { ReleaseSummaryData } from "@/lib/types";

interface ReleaseSummaryProps {
  data: ReleaseSummaryData;
  onRestart: () => void;
}

const statCard = (
  label: string,
  value: string,
  color: string,
  bgColor: string,
  delay: number
) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="rounded-2xl p-4 flex flex-col items-center gap-1 shadow-md"
    style={{ backgroundColor: bgColor }}
  >
    <span className="text-3xl font-black" style={{ color }}>
      {value}
    </span>
    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
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
      className="flex flex-col items-center gap-3 w-full max-w-sm mx-auto px-3 text-center"
    >
      {/* Headline */}
      <div className="flex flex-col items-center gap-0.5">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-5xl tracking-wider text-black leading-none"
        >
          {data.headline}!
        </motion.h1>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.2 }}
          className="font-display text-3xl tracking-wider yellow-highlight leading-tight"
        >
          EMOTIONAL VICTORY!
        </motion.span>
      </div>

      {/* Threat Neutralized badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="inline-flex items-center gap-2 bg-brand-purple-dark text-white rounded-full px-5 py-2"
      >
        <span className="text-brand-yellow">✕</span>
        <span className="text-xs font-black uppercase tracking-widest">
          Threat Neutralized
        </span>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-2xl bg-brand-purple-deep text-white p-5 shadow-lg"
      >
        <p className="text-sm font-semibold opacity-80 mb-1">SITUATION CRITICAL: AVERTED!</p>
        <p className="text-sm leading-relaxed opacity-90">
          {data.roastLine}
        </p>
        <div className="mt-3 text-center">
          <p className="font-display text-3xl tracking-wider text-brand-yellow leading-tight">
            STRESS REDUCED BY {data.stressReduced}%!
          </p>
        </div>
      </motion.div>

      {/* Stat Cards Grid — 2 cards like Stitch */}
      <div className="w-full grid grid-cols-2 gap-3">
        {statCard(
          "Damage Dealt",
          `+${data.hitCount * 28}%`,
          "#22C55E",
          "#F0FDF4",
          0.5
        )}
        {statCard(
          "Stress Left",
          "ZERO",
          "#7C3AED",
          "#FAF5FF",
          0.6
        )}
      </div>

      {/* Buttons — pill-shaped, matching Stitch order */}
      <div className="w-full flex flex-col gap-2.5 mt-1">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="w-full py-3.5 rounded-full generate-btn text-black text-lg font-black uppercase tracking-wide shadow-[0_4px_0_0_rgba(0,0,0,0.10)]"
        >
          Bash Another Boss
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => {}}
          className="w-full py-3 rounded-full bg-white text-black text-sm font-black uppercase tracking-wider shadow-sm border border-gray-200"
        >
          ↗ Share My Victory
        </motion.button>
      </div>
    </motion.div>
  );
}
