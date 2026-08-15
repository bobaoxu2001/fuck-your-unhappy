import { getUtcDateKey } from "./dailyBoss";
import type { MonsterData, ReleaseOutcome } from "./types";

const COLLECTION_SCHEMA_VERSION = 1 as const;
const STORAGE_KEY = "unhappy-buster-collection-v1";
const MAX_ENCOUNTERS = 100;
const MAX_COUNTER = 1_000_000;

export type UnlockKind = "prop" | "scene" | "finisher";
export type UnlockMetric = "encounters" | "defeated" | "uniqueArchetypes" | "uniqueVibes" | "bestCombo";

export interface EncounterInput {
  monster: Pick<MonsterData, "name" | "archetype" | "vibe">;
  outcome: ReleaseOutcome;
  date?: Date | string;
  bestCombo?: number;
  bestTimeMs?: number;
}

export interface CollectionEncounter {
  /** Fictional display label generated for the cartoon monster; never the vent. */
  name: string;
  archetype: string;
  vibe: MonsterData["vibe"];
  outcome: ReleaseOutcome;
  dateKey: string;
  bestCombo?: number;
  bestTimeMs?: number;
}

interface StoredCollection {
  schemaVersion: typeof COLLECTION_SCHEMA_VERSION;
  encounters: CollectionEncounter[];
}

export interface CollectionStats {
  encounters: number;
  defeated: number;
  released: number;
  named: number;
  uniqueArchetypes: number;
  uniqueVibes: number;
  bestCombo: number;
  bestTimeMs?: number;
}

export interface UnlockDefinition {
  id: string;
  kind: UnlockKind;
  label: string;
  emoji: string;
  metric: UnlockMetric;
  target: number;
  requirement: string;
}

export interface UnlockStatus extends UnlockDefinition {
  unlocked: boolean;
  current: number;
}

export interface CollectionSnapshot extends StoredCollection {
  stats: CollectionStats;
  archetypes: string[];
  vibes: MonsterData["vibe"][];
  unlocks: UnlockStatus[];
}

export const UNLOCK_CATALOG: readonly UnlockDefinition[] = [
  { id: "slipper", kind: "prop", label: "Slipper", emoji: "🩴", metric: "encounters", target: 0, requirement: "Available from the start" },
  { id: "office", kind: "scene", label: "Office", emoji: "🏢", metric: "encounters", target: 0, requirement: "Available from the start" },
  { id: "released", kind: "finisher", label: "RELEASED!!", emoji: "✨", metric: "encounters", target: 0, requirement: "Available from the start" },
  { id: "hammer", kind: "prop", label: "Hammer", emoji: "🔨", metric: "encounters", target: 1, requirement: "Finish 1 round" },
  { id: "chicken", kind: "prop", label: "Rubber Chicken", emoji: "🐔", metric: "defeated", target: 1, requirement: "Defeat 1 boss" },
  { id: "home", kind: "scene", label: "Home", emoji: "🏠", metric: "encounters", target: 2, requirement: "Finish 2 rounds" },
  { id: "cooked", kind: "finisher", label: "COOKED!!", emoji: "🏆", metric: "bestCombo", target: 4, requirement: "Reach a 4-hit combo" },
  { id: "classroom", kind: "scene", label: "Classroom", emoji: "🏫", metric: "uniqueArchetypes", target: 3, requirement: "Discover 3 monster types" },
  { id: "coffee", kind: "prop", label: "Coffee Splash", emoji: "☕", metric: "uniqueVibes", target: 3, requirement: "Discover 3 stress vibes" },
  { id: "keyboard", kind: "prop", label: "Keyboard", emoji: "⌨️", metric: "defeated", target: 5, requirement: "Defeat 5 bosses" },
  { id: "vibe-cleared", kind: "finisher", label: "VIBE CLEARED!!", emoji: "⚡", metric: "encounters", target: 7, requirement: "Finish 7 rounds" },
] as const;

const VIBES: readonly MonsterData["vibe"][] = [
  "corporate",
  "family",
  "dating",
  "friendship",
  "school",
  "online",
  "general",
];
const OUTCOMES: readonly ReleaseOutcome[] = ["defeated", "released", "named"];

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function boundedInteger(value: unknown, maximum: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(maximum, Math.round(value)));
}

function safeFictionalLabel(value: unknown, fallback: string, maxLength: number) {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[private]")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "[private]")
    .replace(/(?<!\w)(?:\+?\d[\d\s().-]{7,}\d)(?!\w)/g, "[private]")
    .replace(/(^|\s)@[A-Z0-9_]{2,32}\b/gi, "$1[private]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
  return cleaned || fallback;
}

function normalizeEncounter(value: unknown): CollectionEncounter | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (!VIBES.includes(record.vibe as MonsterData["vibe"])
    || !OUTCOMES.includes(record.outcome as ReleaseOutcome)) return null;
  let dateKey: string;
  try {
    dateKey = getUtcDateKey(typeof record.dateKey === "string" ? record.dateKey : "");
  } catch {
    return null;
  }
  const bestCombo = boundedInteger(record.bestCombo, 9_999);
  const bestTimeMs = boundedInteger(record.bestTimeMs, 3_600_000);
  return {
    name: safeFictionalLabel(record.name, "Mystery Monster", 48),
    archetype: safeFictionalLabel(record.archetype, "mystery pattern", 48).toLowerCase(),
    vibe: record.vibe as MonsterData["vibe"],
    outcome: record.outcome as ReleaseOutcome,
    dateKey,
    ...(bestCombo === undefined ? {} : { bestCombo }),
    ...(bestTimeMs === undefined || bestTimeMs === 0 ? {} : { bestTimeMs }),
  };
}

function emptyStoredCollection(): StoredCollection {
  return { schemaVersion: COLLECTION_SCHEMA_VERSION, encounters: [] };
}

function readStoredCollection(storage = getBrowserStorage()): StoredCollection {
  if (!storage) return emptyStoredCollection();
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyStoredCollection();
    const record = parsed as Record<string, unknown>;
    if (record.schemaVersion !== COLLECTION_SCHEMA_VERSION || !Array.isArray(record.encounters)) {
      return emptyStoredCollection();
    }
    return {
      schemaVersion: COLLECTION_SCHEMA_VERSION,
      encounters: record.encounters
        .map(normalizeEncounter)
        .filter((item): item is CollectionEncounter => item !== null)
        .slice(-MAX_ENCOUNTERS),
    };
  } catch {
    return emptyStoredCollection();
  }
}

function collectionStats(encounters: readonly CollectionEncounter[]): CollectionStats {
  const completed = encounters.filter(({ outcome }) => outcome === "defeated" || outcome === "released");
  const times = completed
    .map(({ bestTimeMs }) => bestTimeMs)
    .filter((value): value is number => typeof value === "number" && value > 0);
  return {
    encounters: Math.min(encounters.length, MAX_COUNTER),
    defeated: encounters.filter(({ outcome }) => outcome === "defeated").length,
    released: encounters.filter(({ outcome }) => outcome === "released").length,
    named: encounters.filter(({ outcome }) => outcome === "named").length,
    uniqueArchetypes: new Set(completed.map(({ archetype }) => archetype)).size,
    uniqueVibes: new Set(completed.map(({ vibe }) => vibe)).size,
    bestCombo: Math.max(0, ...completed.map(({ bestCombo = 0 }) => bestCombo)),
    ...(times.length === 0 ? {} : { bestTimeMs: Math.min(...times) }),
  };
}

export function getUnlocks(stats: CollectionStats): UnlockStatus[] {
  return UNLOCK_CATALOG.map((definition) => {
    const current = stats[definition.metric];
    return {
      ...definition,
      current,
      unlocked: current >= definition.target,
    };
  });
}

function snapshot(stored: StoredCollection): CollectionSnapshot {
  const completed = stored.encounters.filter(({ outcome }) => outcome === "defeated" || outcome === "released");
  const stats = collectionStats(stored.encounters);
  return {
    ...stored,
    stats,
    archetypes: [...new Set(completed.map(({ archetype }) => archetype))].sort(),
    vibes: [...new Set(completed.map(({ vibe }) => vibe))].sort(),
    unlocks: getUnlocks(stats),
  };
}

export function readCollection(): CollectionSnapshot {
  return snapshot(readStoredCollection());
}

/** Stable empty view for the server and first client render. */
export function createEmptyCollectionSnapshot(): CollectionSnapshot {
  return snapshot(emptyStoredCollection());
}

/** Persists only fictional monster metadata and bounded game stats; no vent is accepted. */
export function recordEncounter(input: EncounterInput): CollectionSnapshot {
  const stored = readStoredCollection();
  const encounter = normalizeEncounter({
    name: input.monster.name,
    archetype: input.monster.archetype,
    vibe: input.monster.vibe,
    outcome: input.outcome,
    dateKey: getUtcDateKey(input.date ?? new Date()),
    bestCombo: input.bestCombo,
    bestTimeMs: input.bestTimeMs,
  });
  if (!encounter) return snapshot(stored);
  const next: StoredCollection = {
    schemaVersion: COLLECTION_SCHEMA_VERSION,
    encounters: [...stored.encounters, encounter].slice(-MAX_ENCOUNTERS),
  };
  const storage = getBrowserStorage();
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Gameplay still works when storage is unavailable or full.
  }
  return snapshot(next);
}

export function getNextUnlock(snapshot: CollectionSnapshot): UnlockStatus | undefined {
  return snapshot.unlocks.find(({ unlocked }) => !unlocked);
}

export function remainingForUnlock(unlock: UnlockStatus) {
  return Math.max(0, unlock.target - unlock.current);
}

export function getNewUnlocks(
  before: CollectionSnapshot,
  after: CollectionSnapshot,
): UnlockStatus[] {
  const previouslyUnlocked = new Set(before.unlocks.filter(({ unlocked }) => unlocked).map(({ id }) => id));
  return after.unlocks.filter(({ id, unlocked }) => unlocked && !previouslyUnlocked.has(id));
}

export function exportCollection(): string {
  const current = readCollection();
  return JSON.stringify({
    schemaVersion: current.schemaVersion,
    encounters: current.encounters,
    stats: current.stats,
    archetypes: current.archetypes,
    vibes: current.vibes,
    unlockedIds: current.unlocks.filter(({ unlocked }) => unlocked).map(({ id }) => id),
  }, null, 2);
}

export function clearCollection(): CollectionSnapshot {
  try {
    getBrowserStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // Return the empty in-memory view even if browser storage is unavailable.
  }
  return snapshot(emptyStoredCollection());
}
