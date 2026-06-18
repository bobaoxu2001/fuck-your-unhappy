import { BattleRecord, MonsterData, ReleaseSummaryData } from "./types";

const KEY = "fyu-history";
const MAX_RECORDS = 50;

export function getRecords(): BattleRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BattleRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveBattle(
  monster: MonsterData,
  summary: ReleaseSummaryData,
  stressBefore: number,
  stressAfter: number,
): BattleRecord[] {
  const record: BattleRecord = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: Date.now(),
    monsterName: monster.name,
    monsterEmoji: monster.emoji,
    monsterColor: monster.color,
    vibe: monster.vibe,
    archetype: monster.archetype,
    totalDamage: summary.totalDamage ?? 0,
    hitCount: summary.hitCount,
    bestCombo: summary.bestCombo,
    rageActivations: summary.rageActivations ?? 0,
    stressBefore,
    stressAfter,
  };

  const next = [record, ...getRecords()].slice(0, MAX_RECORDS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — non-fatal */
  }
  return next;
}

export function clearRecords(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export interface Aggregate {
  battles: number;
  totalDamage: number;
  totalStressReleased: number;
  monstersDefeated: number;
}

export function aggregate(records: BattleRecord[]): Aggregate {
  return records.reduce<Aggregate>(
    (acc, r) => ({
      battles: acc.battles + 1,
      totalDamage: acc.totalDamage + (r.totalDamage || 0),
      totalStressReleased:
        acc.totalStressReleased + Math.max(0, r.stressBefore - r.stressAfter),
      monstersDefeated: acc.monstersDefeated + (r.hitCount > 0 ? 1 : 0),
    }),
    { battles: 0, totalDamage: 0, totalStressReleased: 0, monstersDefeated: 0 },
  );
}
