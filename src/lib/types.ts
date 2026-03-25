export interface MonsterData {
  name: string;
  emoji: string;
  description: string;
  weakness: string;
  color: string;
  keywords: string[];
  taunts?: string[];
  archetype?: string;   // human relationship type e.g. "toxic boss", "helicopter parent"
  aura?: string;        // oppressive energy e.g. "weaponized incompetence"
  appearance?: string;  // cartoon visual description e.g. "a sweaty man in a polo shirt"
  vibe?: string;        // context category: "corporate" | "family" | "dating" | "friendship" | "school" | "online"
  reactions?: string[]; // defensive phrases said when hit e.g. "You're too sensitive!"
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
