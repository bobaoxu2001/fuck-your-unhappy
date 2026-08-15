"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { MonsterData } from "@/lib/types";

interface CharacterRevealProps {
  monster: MonsterData;
  onReady: () => void;
  onReroll: () => void;
  loading?: boolean;
  imageLoading?: boolean;
  imageError?: string;
  rerollsLeft?: number;
  publicBoss?: boolean;
}

const VIBE_CONFIG: Record<string, { emoji: string; label: string; bg: string; text: string }> = {
  corporate: { emoji: "▦", label: "Work chaos", bg: "#DBEAFE", text: "#1D4ED8" },
  family: { emoji: "⌂", label: "Home chaos", bg: "#FEF3C7", text: "#92400E" },
  dating: { emoji: "♡", label: "Dating chaos", bg: "#FCE7F3", text: "#9D174D" },
  friendship: { emoji: "◇", label: "Friend chaos", bg: "#DCFCE7", text: "#166534" },
  school: { emoji: "✎", label: "School chaos", bg: "#EDE9FE", text: "#5B21B6" },
  online: { emoji: "#", label: "Online chaos", bg: "#E0F2FE", text: "#075985" },
  general: { emoji: "⚡", label: "General chaos", bg: "#F3F4F6", text: "#374151" },
};

function EnemyFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-gray-50 px-3 py-2 text-left ring-1 ring-black/5">
      <p className="text-[8px] font-black uppercase tracking-widest text-gray-500">{label}</p>
      <p className="mt-0.5 text-[11px] font-black leading-snug text-gray-800">{value}</p>
    </div>
  );
}

export default function CharacterReveal({
  monster,
  onReady,
  onReroll,
  loading,
  imageLoading,
  imageError,
  rerollsLeft = 1,
  publicBoss = false,
}: CharacterRevealProps) {
  const vibe = VIBE_CONFIG[monster.vibe] ?? VIBE_CONFIG.general;
  const portrait = monster.image || "/stress-goblin.webp";
  const portraitStatus = imageError || (imageLoading ? "Custom portrait developing…" : "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-1"
    >
      <div className="flex w-full items-center gap-2 px-2">
        <div className="h-px flex-1 bg-gray-300" />
        <h2 className="text-[9px] font-black uppercase tracking-[0.18em] text-gray-600 sm:text-[10px] sm:tracking-[0.22em]">
          {publicBoss ? "Today’s public boss, ready to play" : "Your bad vibe, now safely fictional"}
        </h2>
        <div className="h-px flex-1 bg-gray-300" />
      </div>

      <motion.section
        layout
        className="relative w-full overflow-hidden rounded-[1.6rem] border-2 bg-white/95 p-3 text-left shadow-2xl sm:rounded-[2rem] sm:p-5"
        style={{ borderColor: monster.color }}
      >
        <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: monster.color }} />

        <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[190px_minmax(0,1fr)] sm:gap-5">
          <div className="relative aspect-square w-full overflow-hidden rounded-[1.15rem] bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 shadow-lg ring-2 ring-white sm:rounded-[1.5rem] sm:ring-4">
            <Image
              src={portrait}
              alt={`${monster.name}, a fictional ${monster.archetype} stress monster`}
              fill
              unoptimized={Boolean(monster.image)}
              sizes="(min-width: 640px) 190px, 112px"
              className="object-cover"
            />
            {portraitStatus && (
              <div className="absolute inset-x-1.5 bottom-1.5 rounded-full bg-black/75 px-2 py-1 text-center text-[8px] font-black leading-tight text-white backdrop-blur sm:inset-x-3 sm:bottom-3 sm:text-[10px]">
                {imageError ? "House mascot on duty" : "Custom art loading…"}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider"
                style={{ backgroundColor: vibe.bg, color: vibe.text }}
              >
                <span aria-hidden>{vibe.emoji}</span> {vibe.label}
              </span>
              <span
                className="max-w-full truncate rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-wider text-white"
                style={{ backgroundColor: monster.color }}
              >
                {monster.archetype}
              </span>
            </div>

            <h3
              className="mt-2 break-words text-2xl font-black uppercase leading-[0.95] tracking-wide sm:text-4xl"
              style={{ color: monster.color }}
            >
              {monster.name}
            </h3>
            <div className="mt-2 rounded-xl bg-brand-yellow-light px-2.5 py-2">
              <p className="text-[8px] font-black uppercase tracking-widest text-amber-900">Battle weakness</p>
              <p className="mt-0.5 text-[11px] font-black leading-snug text-amber-950 sm:text-xs">{monster.weakness}</p>
            </div>
          </div>
        </div>

        <blockquote className="mt-3 rounded-xl bg-brand-purple-dark px-3 py-2.5 text-xs font-bold italic leading-snug text-white sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
          “{monster.battleIntro}”
        </blockquote>

        <details className="group mt-2 rounded-xl bg-gray-50 ring-1 ring-black/5">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 [&::-webkit-details-marker]:hidden">
            View enemy dossier
            <span aria-hidden className="text-base transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <div className="border-t border-black/5 px-3 pb-3 pt-2">
            <p className="text-xs font-semibold italic leading-relaxed text-gray-500">{monster.appearance}</p>
            <p className="mt-1.5 text-xs font-semibold leading-relaxed text-gray-700">{monster.description}</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <EnemyFact label="Crime" value={monster.crime} />
              <EnemyFact label="Toxic skill" value={monster.toxicSkill} />
              <EnemyFact label="Diagnosis" value={monster.diagnosis} />
              <EnemyFact label="Aura" value={monster.aura} />
            </div>
          </div>
        </details>

        <p className="sr-only" aria-live="polite">{portraitStatus}</p>
      </motion.section>

      <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReady}
          disabled={loading}
          className="min-h-12 rounded-2xl bg-brand-yellow px-4 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_4px_0_rgba(0,0,0,0.12)] disabled:opacity-60 sm:text-base"
        >
          Enter arena →
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onReroll}
          disabled={loading || rerollsLeft <= 0}
          aria-label={rerollsLeft > 0 ? `Re-roll monster, ${rerollsLeft} left` : "Re-roll already used"}
          className="min-h-12 rounded-2xl border-2 border-gray-200 bg-white px-3 py-3 text-[11px] font-black uppercase tracking-wide text-gray-600 disabled:opacity-45 sm:px-5 sm:text-sm"
        >
          {loading ? "Recasting…" : rerollsLeft > 0 ? `↻ Re-roll (${rerollsLeft})` : "Re-roll used"}
        </motion.button>
      </div>
    </motion.div>
  );
}
