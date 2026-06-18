export interface MonsterData {
  name: string;
  emoji: string;
  archetype: string;
  appearance: string;
  description: string;
  personality: string;
  weakness: string;
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
  victoryMessage?: string;
}

export type Screen = "input" | "reveal" | "arena" | "cooldown" | "summary";

export interface BattleRecord {
  id: string;
  date: number;
  monsterName: string;
  monsterEmoji: string;
  monsterColor: string;
  vibe: string;
  archetype: string;
  totalDamage: number;
  hitCount: number;
  bestCombo: number;
  rageActivations: number;
  stressBefore: number;
  stressAfter: number;
}
