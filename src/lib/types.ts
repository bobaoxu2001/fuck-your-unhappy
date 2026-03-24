export interface MonsterData {
  name: string;
  emoji: string;
  description: string;
  weakness: string;
  color: string;
  keywords: string[];
}

export interface ReleaseSummaryData {
  monsterName: string;
  hitCount: number;
  bestCombo: number;
  stressReduced: number;
  headline: string;
  roastLine: string;
  emoji: string;
}

export type Screen = "input" | "reveal" | "arena" | "summary";
