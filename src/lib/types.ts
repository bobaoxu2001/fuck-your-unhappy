export interface MonsterData {
  name: string;
  emoji: string;
  description: string;
  weakness: string;
  color: string;
  keywords: string[];
  taunts?: string[];
  archetype?: string; // e.g. "tyrant", "ghost", "bureaucrat"
  aura?: string;      // e.g. "toxic positivity", "passive aggression"
}

export interface ReleaseSummaryData {
  monsterName: string;
  hitCount: number;
  bestCombo: number;
  stressReduced: number;
  headline: string;
  roastLine: string;
  sceneId?: string;
  toolId?: string;
  totalDamage?: number;
  maxSingleHit?: number;
  rageActivations?: number;
}

export type Screen = "input" | "reveal" | "arena" | "summary";
