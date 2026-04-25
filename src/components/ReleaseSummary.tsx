"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ReleaseSummaryData } from "@/lib/types";

interface ReleaseSummaryProps {
  data: ReleaseSummaryData;
  onRestart: () => void;
}

function StatCard({
  label,
  value,
  color,
  bgColor,
  delay,
}: {
  label: string;
  value: string;
  color: string;
  bgColor: string;
  delay: number;
}) {
  return (
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
}

export default function ReleaseSummary({ data, onRestart }: ReleaseSummaryProps) {
  const [shareLabel, setShareLabel] = useState("↗ Share My Victory");
  const isVictory = data.hitCount > 0;
  const shareText = isVictory
    ? `I just defeated ${data.monsterName} in Fuck Your Unhappy: ${data.totalDamage ?? 0} damage, best combo x${data.bestCombo}.`
    : `I named my stress monster ${data.monsterName} in Fuck Your Unhappy. Next round: boss fight.`;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "Fuck Your Unhappy",
          text: shareText,
          url: window.location.origin,
        });
      } else {
        await navigator.clipboard.writeText(`${shareText} ${window.location.origin}`);
      }
      setShareLabel("Copied Victory!");
    } catch {
      setShareLabel("Share Cancelled");
    } finally {
      setTimeout(() => setShareLabel("↗ Share My Victory"), 1800);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", duration: 0.6 }}
      className="flex flex-col items-center gap-4 w-full max-w-2xl mx-auto px-1 text-center"
    >
      {/* Headline */}
      <div className="flex flex-col items-center gap-0.5">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="font-display text-6xl tracking-wider text-black leading-none md:text-7xl"
        >
          {data.headline}!
        </motion.h1>
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 12, delay: 0.2 }}
          className="font-display text-3xl tracking-wider yellow-highlight leading-tight"
        >
          {isVictory ? "EMOTIONAL VICTORY!" : "MONSTER IDENTIFIED!"}
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
          {isVictory ? "Threat Neutralized" : "Ready For Round Two"}
        </span>
      </motion.div>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full rounded-[2rem] bg-brand-purple-deep text-white p-6 shadow-2xl md:p-7"
      >
        <p className="text-sm font-semibold opacity-80 mb-1">SITUATION CRITICAL: AVERTED!</p>
        <p className="text-sm leading-relaxed opacity-90">{data.roastLine}</p>
        <div className="mt-3 text-center">
          <p className="font-display text-3xl tracking-wider text-brand-yellow leading-tight">
            {isVictory ? `STRESS REDUCED BY ${data.stressReduced}%!` : "STRESS MONSTER IDENTIFIED!"}
          </p>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="w-full grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Total Damage"
          value={(data.totalDamage ?? 0).toLocaleString()}
          color="#EF4444"
          bgColor="#FFF1F2"
          delay={0.5}
        />
        <StatCard
          label="Biggest Hit"
          value={String(data.maxSingleHit ?? 0)}
          color="#F97316"
          bgColor="#FFF7ED"
          delay={0.6}
        />
        <StatCard
          label="Turns"
          value={String(data.hitCount)}
          color="#7C3AED"
          bgColor="#FAF5FF"
          delay={0.7}
        />
        <StatCard
          label="Best Combo"
          value={`×${data.bestCombo}`}
          color="#DC2626"
          bgColor="#FEF2F2"
          delay={0.8}
        />
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">
        Rage activations: {data.rageActivations ?? 0}🔥
      </p>

      {/* Buttons */}
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
          onClick={handleShare}
          className="w-full py-3 rounded-full bg-white text-black text-sm font-black uppercase tracking-wider shadow-sm border border-gray-200"
        >
          {shareLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
