export interface MonsterData {
  name: string;
  emoji: string;
  archetype: string;
  appearance: string;
  description: string;
  personality: string;
  crime: string;
  toxicSkill: string;
  weakness: string;
  finalRoast: string;
  diagnosis: string;
  battleIntro: string;
  victoryMessage: string;
  color: string;
  keywords: string[];
  taunts: string[];
  reactions: string[];
  aura: string;        // oppressive energy e.g. "weaponized incompetence"
  vibe: "corporate" | "family" | "dating" | "friendship" | "school" | "online" | "general";
  image?: string;
  fallback?: boolean;
}

export type ReleaseOutcome = "defeated" | "released" | "named";

export interface ReleaseSummaryData {
  outcome: ReleaseOutcome;
  monsterName: string;
  monsterArchetype: string;
  monsterEmoji: string;
  monsterImage?: string;
  hitCount: number;
  bestCombo: number;
  arenaProgress: number;
  headline: string;
  roastLine: string;
  closureLine: string;
  nextStep: string;
  releaseStatus: string;
  sceneId?: string;
  toolId?: string;
  totalDamage: number;
  maxSingleHit: number;
  rageActivations: number;
  elapsedSeconds: number;
  victoryMessage: string;
  bestHit: string;
  finalRoast: string;
}

export type Screen = "input" | "reveal" | "arena" | "summary";
