"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { readSafeChallengeBenchmark } from "@/lib/dailyBoss";
import { remainingForUnlock, type UnlockStatus } from "@/lib/localCollection";
import { createVictoryCard, downloadVictoryCard } from "@/lib/shareVictory";
import { ReleaseOutcome, ReleaseSummaryData } from "@/lib/types";

interface ReleaseSummaryProps {
  data: ReleaseSummaryData;
  onRestart: () => void;
  onReplaySameMonster?: () => void;
  challengeUrl?: string | null;
  newUnlocks?: Array<{ id: string; emoji: string; label: string }>;
  nextUnlock?: UnlockStatus;
  tomorrowBossName?: string;
  onShareEvent?: (event: "share_started" | "share_completed" | "mood_better" | "mood_same" | "mood_worse") => void;
}

type Mood = "better" | "same" | "worse";

const OUTCOME_COPY: Record<ReleaseOutcome, { eyebrow: string; badge: string }> = {
  defeated: { eyebrow: "Round complete", badge: "Boss cleared on your terms" },
  released: { eyebrow: "You called time", badge: "Stopping is also control" },
  named: { eyebrow: "Pattern identified", badge: "Naming it counts" },
};

const MOODS: Array<{ id: Mood; label: string; icon: string }> = [
  { id: "better", label: "Lighter", icon: "↗" },
  { id: "same", label: "Same", icon: "→" },
  { id: "worse", label: "Wound up", icon: "↘" },
];

function getChallengeBenchmark(challengeUrl: string | null | undefined): number | null {
  if (!challengeUrl) return null;
  try {
    return readSafeChallengeBenchmark(new URL(challengeUrl).searchParams);
  } catch {
    return null;
  }
}

export default function ReleaseSummary({
  data,
  onRestart,
  onReplaySameMonster,
  challengeUrl,
  newUnlocks = [],
  nextUnlock,
  tomorrowBossName,
  onShareEvent,
}: ReleaseSummaryProps) {
  const [shareLabel, setShareLabel] = useState(challengeUrl ? "Share safe challenge" : "Share safe card");
  const [sharing, setSharing] = useState(false);
  const [mood, setMood] = useState<Mood | null>(null);
  const resetShareTimerRef = useRef<number | null>(null);
  const outcomeCopy = OUTCOME_COPY[data.outcome];
  const portrait = data.monsterImage || "/stress-goblin.webp";
  const challengeBenchmark = getChallengeBenchmark(challengeUrl);

  useEffect(() => () => {
    if (resetShareTimerRef.current) window.clearTimeout(resetShareTimerRef.current);
  }, []);

  const handleShare = async () => {
    if (sharing) return;
    onShareEvent?.("share_started");
    setSharing(true);
    setShareLabel("Building…");
    const shareText = challengeUrl
      ? challengeBenchmark
        ? `I cleared ${data.monsterName} in ${challengeBenchmark}s. Can you beat that? This challenge contains no private vent. #UnhappyBuster`
        : `Can you clear ${data.monsterName} too? This challenge contains no private vent. #UnhappyBuster`
      : `${data.monsterName} became a fictional bad-vibe boss. ${data.arenaProgress}% cleared. #UnhappyBuster`;

    try {
      const blob = await createVictoryCard(data);
      const file = new File([blob], "unhappy-buster-victory.png", { type: "image/png" });
      const url = challengeUrl ?? window.location.origin;
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ title: "Unhappy Buster", text: shareText, url, files: [file] });
      } else if (navigator.share) {
        await navigator.share({ title: "Unhappy Buster", text: shareText, url });
      } else {
        downloadVictoryCard(blob);
        await navigator.clipboard?.writeText(`${shareText} ${url}`);
      }
      onShareEvent?.("share_completed");
      setShareLabel("Ready to send ✓");
    } catch (error) {
      setShareLabel(error instanceof DOMException && error.name === "AbortError" ? "Share cancelled" : "Try sharing again");
    } finally {
      setSharing(false);
      resetShareTimerRef.current = window.setTimeout(
        () => setShareLabel(challengeUrl ? "Share safe challenge" : "Share safe card"),
        2_000,
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-1 text-center"
    >
      <section className="grid w-full grid-cols-[112px_1fr] overflow-hidden rounded-[1.6rem] bg-brand-purple-deep text-left text-white shadow-2xl sm:grid-cols-[180px_1fr]">
        <div className="relative min-h-[168px] overflow-hidden">
          <Image src={portrait} alt={`${data.monsterName}, the fictional stress boss`} fill unoptimized={Boolean(data.monsterImage)} sizes="180px" className="object-cover" />
          <div className="absolute inset-x-2 bottom-2 rounded-full bg-black/75 px-2 py-1 text-center text-[8px] font-black uppercase tracking-wide">{data.monsterName}</div>
        </div>
        <div className="flex min-w-0 flex-col justify-center p-3.5">
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-brand-yellow">{outcomeCopy.eyebrow}</p>
          <h2 className="mt-0.5 font-display text-3xl leading-none tracking-wide sm:text-5xl">{data.headline}</h2>
          <p className="mt-1 text-[9px] font-black uppercase tracking-wider text-white/60">✓ {outcomeCopy.badge}</p>
          <p className="mt-2 text-sm font-black leading-snug text-brand-yellow">“{data.finalRoast}”</p>
          {data.roastLine !== data.finalRoast && (
            <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-white/75">{data.roastLine}</p>
          )}
        </div>
      </section>

      {newUnlocks.length > 0 && (
        <div role="status" className="w-full rounded-xl bg-brand-yellow px-3 py-2 text-xs font-black text-black shadow">
          NEW UNLOCK · {newUnlocks.map(({ emoji, label }) => `${emoji} ${label}`).join(" · ")}
        </div>
      )}

      <section className="w-full rounded-[1.4rem] bg-white/90 p-3 shadow-md ring-1 ring-black/5">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            [`${data.arenaProgress}%`, "Cleared"],
            [data.outcome === "defeated" ? `${data.elapsedSeconds}s` : data.hitCount, data.outcome === "defeated" ? "Clear time" : "Hits"],
            [`×${data.bestCombo}`, "Combo"],
            [data.rageActivations, "Boosts"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-xl bg-gray-50 px-1 py-2">
              <p className="text-base font-black text-brand-purple">{value}</p>
              <p className="text-[7px] font-black uppercase tracking-wider text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-2 rounded-xl bg-brand-yellow-light px-3 py-2 text-left">
          <p className="text-[8px] font-black uppercase tracking-widest text-amber-900">One tiny next move</p>
          <p className="mt-0.5 text-xs font-bold leading-snug text-amber-950">{data.nextStep}</p>
        </div>

        {(nextUnlock || tomorrowBossName) && (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {nextUnlock && (
              <p className="rounded-xl bg-purple-50 px-3 py-2 text-left text-[11px] font-bold leading-snug text-brand-purple-deep">
                {remainingForUnlock(nextUnlock)} more to unlock {nextUnlock.emoji} {nextUnlock.label}. {nextUnlock.requirement}.
              </p>
            )}
            {tomorrowBossName && (
              <p className="rounded-xl bg-sky-50 px-3 py-2 text-left text-[11px] font-bold leading-snug text-sky-900">
                Tomorrow&apos;s public boss: {tomorrowBossName}. No vent required.
              </p>
            )}
          </div>
        )}

        <div className="mt-2">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">How do you feel now?</p>
          <div className="mt-1 grid grid-cols-3 gap-1.5">
            {MOODS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setMood(option.id);
                  onShareEvent?.(`mood_${option.id}`);
                }}
                aria-pressed={mood === option.id}
                className={`min-h-10 rounded-xl px-1 text-[10px] font-black ${mood === option.id ? "bg-brand-yellow text-black ring-2 ring-brand-purple" : "bg-gray-50 text-gray-600 ring-1 ring-black/5"}`}
              >
                <span aria-hidden>{option.icon}</span> {option.label}
              </button>
            ))}
          </div>
        </div>

        {mood === "worse" && (
          <p role="status" className="mt-2 rounded-xl bg-orange-50 px-3 py-2 text-left text-[10px] font-bold leading-snug text-orange-900">
            Pause here, step away, and reach out to someone you trust. If anyone may be in immediate danger, contact local emergency services.
          </p>
        )}

        <details className="mt-2 rounded-xl bg-gray-50 text-left ring-1 ring-black/5">
          <summary className="min-h-9 cursor-pointer list-none px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-600 [&::-webkit-details-marker]:hidden">Full closure notes + privacy ▾</summary>
          <div className="border-t border-gray-100 px-3 py-2 text-[10px] font-semibold leading-relaxed text-gray-600">
            <p>{data.closureLine}</p>
            <p className="mt-1">
              Share cards and challenges never include your vent, real-person names, or contact details.{" "}
              <Link href="/privacy" className="underline decoration-brand-purple/40 underline-offset-2">
                Privacy
              </Link>
            </p>
          </div>
        </details>
      </section>

      <div className="grid w-full grid-cols-2 gap-2">
        <button type="button" onClick={handleShare} disabled={sharing} className="generate-btn min-h-12 rounded-full px-3 py-3 text-xs font-black uppercase tracking-wide text-black shadow disabled:opacity-60">{shareLabel}</button>
        <button type="button" onClick={onRestart} className="min-h-12 rounded-full bg-brand-purple px-3 py-3 text-xs font-black uppercase tracking-wide text-white shadow">New bad vibe</button>
        {onReplaySameMonster && (
          <button type="button" onClick={onReplaySameMonster} className="col-span-2 min-h-10 rounded-full border-2 border-gray-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-wide text-gray-600">↻ Same boss, new strategy</button>
        )}
      </div>
    </motion.div>
  );
}
