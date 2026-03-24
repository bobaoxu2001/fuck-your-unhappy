import { MonsterData, ReleaseSummaryData } from "./types";

const ROASTS = [
  (name: string) => `${name} didn't stand a chance against your rage.`,
  (name: string) => `That was personal. ${name} is filing a restraining order.`,
  (name: string) => `You hit so hard, ${name}'s therapist needs a therapist.`,
  (name: string) => `${name} has left the chat. Permanently.`,
  (name: string) => `${name} just ragequit existence.`,
];

const HEADLINES = [
  "TARGET DESTROYED",
  "BOSS ELIMINATED",
  "RAGE COMPLETE",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function buildSummary(
  monster: MonsterData,
  hitCount: number,
  bestCombo: number,
): ReleaseSummaryData {
  return {
    monsterName: monster.name,
    hitCount,
    bestCombo,
    stressReduced: Math.min(100, Math.round(40 + hitCount * 3 + bestCombo * 5)),
    headline: pickRandom(HEADLINES),
    roastLine: pickRandom(ROASTS)(monster.name),
  };
}
