"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BattleRecord, MonsterData } from "@/lib/types";
import { aggregate, computeStreak } from "@/lib/history";

export type GalleryTab = "monsters" | "history";

interface HistoryGalleryProps {
  initialTab: GalleryTab;
  records: BattleRecord[];
  onClose: () => void;
  onClear: () => void;
  onRematch: (monster: MonsterData) => void;
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
      <span className="text-2xl font-black tabular-nums" style={{ color: accent }}>
        {value}
      </span>
      <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-gray-400">
        {label}
      </span>
    </div>
  );
}

export default function HistoryGallery({
  initialTab,
  records,
  onClose,
  onClear,
  onRematch,
}: HistoryGalleryProps) {
  const [tab, setTab] = useState<GalleryTab>(initialTab);
  const agg = useMemo(() => aggregate(records), [records]);
  const streak = useMemo(() => computeStreak(records), [records]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 backdrop-blur-sm md:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-[#FAF5FF] shadow-2xl md:rounded-[2rem]"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 px-5 pt-4">
            <h2 className="font-display text-2xl tracking-wide text-black">Your Arena</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm ring-1 ring-black/5 hover:text-gray-800"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="mx-5 mt-3 flex gap-1 rounded-2xl bg-white/70 p-1 shadow-sm ring-1 ring-black/5">
            {(["monsters", "history"] as GalleryTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 rounded-xl py-2 text-xs font-black uppercase tracking-widest transition-all ${
                  tab === t ? "bg-brand-purple text-white shadow-md" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {t === "monsters" ? "👾 Monsters" : "📜 History"}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {records.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <span className="text-5xl">🫥</span>
                <p className="font-display text-2xl tracking-wide text-gray-700">No battles yet</p>
                <p className="max-w-xs text-sm font-semibold text-gray-400">
                  Defeat your first stress monster and it&apos;ll show up here.
                </p>
              </div>
            ) : tab === "monsters" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {records.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col items-center gap-1 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-black/5"
                    style={{ borderTop: `3px solid ${r.monsterColor}` }}
                  >
                    <span className="text-4xl leading-none">{r.monsterEmoji}</span>
                    <span className="mt-1 line-clamp-1 text-[11px] font-black uppercase tracking-wide text-gray-700">
                      {r.monsterName}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      {r.hitCount > 0 ? "defeated" : "named"} · {timeAgo(r.date)}
                    </span>
                    {r.monster && (
                      <button
                        onClick={() => onRematch(r.monster as MonsterData)}
                        className="btn-3d mt-1 w-full rounded-full py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                        style={{ backgroundColor: r.monsterColor }}
                      >
                        ⚔ Rematch
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <StatTile label="Day streak" value={`${streak}🔥`} accent="#F97316" />
                  <StatTile label="Total stress released" value={`${agg.totalStressReleased}`} accent="#22C55E" />
                  <StatTile label="Monsters defeated" value={`${agg.monstersDefeated}`} accent="#7C3AED" />
                  <StatTile label="Total damage" value={agg.totalDamage.toLocaleString()} accent="#EF4444" />
                </div>

                <div className="flex flex-col gap-2">
                  {records.map((r) => {
                    const drop = Math.max(0, r.stressBefore - r.stressAfter);
                    return (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5"
                      >
                        <span className="text-2xl">{r.monsterEmoji}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black uppercase tracking-wide text-gray-700">
                            {r.monsterName}
                          </p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            {r.stressBefore}% → {r.stressAfter}% · {timeAgo(r.date)}
                          </p>
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-1 text-[11px] font-black tabular-nums"
                          style={{
                            backgroundColor: drop > 0 ? "#DCFCE7" : "#F3F4F6",
                            color: drop > 0 ? "#15803D" : "#9CA3AF",
                          }}
                        >
                          {drop > 0 ? `−${drop}% 😌` : "±0%"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={onClear}
                  className="mt-1 self-center rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:bg-white hover:text-brand-red"
                >
                  Clear history
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
