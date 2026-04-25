import { MonsterData, ReleaseSummaryData } from "./types";

const ROASTS = [
  (n: string) => `${n} got turned into confetti by healthy emotional processing.`,
  (n: string) => `${n} tried to be intimidating and got bonked into a learning moment.`,
  (n: string) => `${n}'s entire strategy collapsed under one cartoon slipper.`,
  (n: string) => `${n} has left the chat to reconsider their brand.`,
  (n: string) => `${n} ragequit the arena and took the bad vibes with them.`,
  (n: string) => `${n} has been reported to the HR department of karma.`,
  (n: string) => `${n} called. Their drama subscription has been cancelled.`,
  (n: string) => `Scientists confirm: ${n} is 100% emotionally bankrupt.`,
];

const HEADLINES = [
  "BOSS CLEARED",
  "BAD VIBE BONKED",
  "RAGE COMPLETE",
  "NEMESIS NEUTRALIZED",
  "EMOTIONAL VICTORY",
  "THREAT RELEASED",
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
  if (hitCount === 0) {
    return {
      monsterName: monster.name,
      hitCount,
      bestCombo,
      stressReduced: 0,
      headline: "RESET READY",
      roastLine: `${monster.name} is still waiting in the arena. No shame: sometimes naming the monster is the first win.`,
      totalDamage,
      maxSingleHit,
      rageActivations,
      victoryMessage: monster.victoryMessage,
    };
  }

  return {
    monsterName: monster.name,
    hitCount,
    bestCombo,
    stressReduced: Math.min(100, Math.round(40 + hitCount * 1.5 + bestCombo * 3 + rageActivations * 8)),
    headline: pickRandom(HEADLINES),
    roastLine: monster.victoryMessage || pickRandom(ROASTS)(monster.name),
    totalDamage,
    maxSingleHit,
    rageActivations,
    victoryMessage: monster.victoryMessage,
  };
}
