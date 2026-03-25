import { MonsterData, ReleaseSummaryData } from "./types";

const ROASTS = [
  (n: string) => `${n} didn't stand a chance against your rage.`,
  (n: string) => `That was personal. ${n} is filing a restraining order.`,
  (n: string) => `You hit so hard, ${n}'s therapist needs a therapist.`,
  (n: string) => `${n} has left the chat. Permanently.`,
  (n: string) => `${n} just ragequit existence.`,
  (n: string) => `${n} has been reported to the HR department of karma.`,
  (n: string) => `${n} called. They want their dignity back. You said no.`,
  (n: string) => `Scientists confirm: ${n} is 100% emotionally bankrupt.`,
];

const HEADLINES = [
  "TARGET DESTROYED",
  "BOSS ELIMINATED",
  "RAGE COMPLETE",
  "NEMESIS NEUTRALIZED",
  "EMOTIONAL VICTORY",
  "THREAT DELETED",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildSummary(
  monster: MonsterData,
  hitCount: number,
  bestCombo: number,
  totalDamage = 0,
  maxSingleHit = 0,
  rageActivations = 0,
): ReleaseSummaryData {
  return {
    monsterName: monster.name,
    hitCount,
    bestCombo,
    stressReduced: Math.min(100, Math.round(40 + hitCount * 1.5 + bestCombo * 3 + rageActivations * 8)),
    headline: pickRandom(HEADLINES),
    roastLine: pickRandom(ROASTS)(monster.name),
    totalDamage,
    maxSingleHit,
    rageActivations,
  };
}
