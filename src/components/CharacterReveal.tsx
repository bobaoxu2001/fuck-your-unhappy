"use client";

import { motion } from "framer-motion";
import { MonsterData } from "@/lib/types";

interface CharacterRevealProps {
  monster: MonsterData;
  onReady: () => void;
  onReroll: () => void;
  loading?: boolean;
}

// Visual config per vibe context
const VIBE_CONFIG: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  corporate:  { emoji: "🏢", label: "Corporate",  bg: "#DBEAFE", text: "#1D4ED8" },
  family:     { emoji: "🏠", label: "Family",     bg: "#FEF3C7", text: "#B45309" },
  dating:     { emoji: "💔", label: "Dating",     bg: "#FCE7F3", text: "#BE185D" },
  friendship: { emoji: "👥", label: "Friendship", bg: "#DCFCE7", text: "#15803D" },
  school:     { emoji: "🎓", label: "School",     bg: "#EDE9FE", text: "#6D28D9" },
  online:     { emoji: "📱", label: "Online",     bg: "#E0F2FE", text: "#0369A1" },
};

export default function CharacterReveal({
  monster,
  onReady,
  onReroll,
  loading,
}: CharacterRevealProps) {
  const vibe = monster.vibe ? VIBE_CONFIG[monster.vibe.toLowerCase()] : null;

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

        {/* Vibe tag — top right corner */}
        {vibe && (
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="absolute top-3.5 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
            style={{ backgroundColor: vibe.bg, color: vibe.text }}
          >
            <span>{vibe.emoji}</span>
            <span>{vibe.label}</span>
          </motion.div>
        )}

        {/* Emoji */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="text-7xl leading-none mt-2"
        >
          {monster.emoji}
        </motion.div>

        {/* Archetype badge */}
        {monster.archetype && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 12, delay: 0.3 }}
            className="mt-2.5 inline-flex items-center rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
            style={{ backgroundColor: monster.color }}
          >
            {monster.archetype}
          </motion.div>
        )}

        {/* Name */}
        <h3
          className="text-xl font-black mt-2 uppercase tracking-wide"
          style={{ color: monster.color }}
        >
          {monster.name}
        </h3>

        {/* Appearance — italic visual description */}
        {monster.appearance && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-400 mt-0.5 text-[11px] leading-relaxed italic"
          >
            {monster.appearance}
          </motion.p>
        )}

        {/* Description */}
        <p className="text-gray-500 mt-2 text-sm leading-relaxed">
          {monster.description}
        </p>

        {/* Aura */}
        {monster.aura && (
          <p className="mt-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            ✦ {monster.aura}
          </p>
        )}

        {/* Weakness */}
        <div
          className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-black uppercase tracking-wide"
          style={{
            backgroundColor: monster.color + "18",
            color: monster.color,
          }}
        >
          <span>⚡</span> Weakness: {monster.weakness}
        </div>

        {/* Reactions preview — small teaser at the bottom */}
        {monster.reactions && monster.reactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-3 pt-3 border-t border-gray-100"
          >
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-300 mb-1">
              Their defense strategy:
            </p>
            <p className="text-[11px] italic text-gray-400 leading-snug">
              &ldquo;{monster.reactions[0]}&rdquo;
            </p>
          </motion.div>
        )}
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
        disabled={loading}
        className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-bold uppercase tracking-wide bg-white disabled:opacity-40 transition-all"
      >
        {loading ? "🎲 Rolling…" : "🎲 Re-roll"}
      </motion.button>
    </motion.div>
  );
}
