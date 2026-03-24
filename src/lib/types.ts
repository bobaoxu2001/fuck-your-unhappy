export interface MonsterData {
  name: string;
  emoji: string;
  description: string;
  weakness: string;
  color: string;
  keywords: string[];
}

export interface ArenaStats {
  hitCount: number;
  maxHits: number;
}

export interface ReleaseSummaryData {
  monsterName: string;
  hitCount: number;
  stressLevel: string;
  roastLine: string;
  emoji: string;
}

export type Screen = "input" | "reveal" | "arena" | "summary";
