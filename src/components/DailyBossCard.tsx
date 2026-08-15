"use client";

import Image from "next/image";
import { DailyBoss } from "@/lib/dailyBoss";

interface DailyBossCardProps {
  boss: DailyBoss;
  challenge?: boolean;
  onPlay: () => void;
}

export default function DailyBossCard({ boss, challenge = false, onPlay }: DailyBossCardProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.7rem] border-[3px] border-brand-ink bg-brand-purple-deep text-white shadow-[7px_7px_0_#17140f]">
      <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-brand-pink/40 blur-2xl" />
      <div className="relative grid grid-cols-[104px_1fr] items-center gap-3 p-3.5 sm:grid-cols-[124px_1fr]">
        <div className="relative aspect-square overflow-hidden rounded-[1.25rem] border-2 border-white/20 bg-white/10">
          <Image src="/stress-goblin.webp" alt="Today’s fictional public stress boss" fill sizes="124px" className="object-cover" />
          <span className="ink-stamp absolute left-1.5 top-1.5 bg-brand-yellow text-[8px] text-brand-ink">
            {challenge ? "Challenge" : "No typing"}
          </span>
        </div>
        <div className="min-w-0 text-left">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-yellow">
            {challenge ? "A friend dared you. Zero vent attached." : boss.headline}
          </p>
          <h3 className="mt-1 font-display text-[1.85rem] leading-[0.9] tracking-wide sm:text-4xl">{boss.monster.name}</h3>
          <p className="mt-1.5 line-clamp-2 text-[12px] font-bold leading-snug text-white/80">{boss.challengeCopy}</p>
          <button
            type="button"
            onClick={onPlay}
            className="generate-btn mt-3 min-h-12 rounded-full px-5 text-sm font-black uppercase tracking-wide text-brand-ink"
          >
            {challenge ? "Accept the dare →" : "Fight it now →"}
          </button>
        </div>
      </div>
    </section>
  );
}
