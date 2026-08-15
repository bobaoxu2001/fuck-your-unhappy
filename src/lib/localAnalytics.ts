import { getUtcDateKey, isUtcDateKey } from "./dailyBoss";

const ANALYTICS_SCHEMA_VERSION = 1 as const;
const STORAGE_KEY = "unhappy-buster-analytics-v1";
const MAX_COUNT = 1_000_000;

export const LOCAL_ANALYTICS_EVENTS = [
  "app_opened",
  "input_started",
  "quick_context_selected",
  "generation_started",
  "monster_revealed",
  "battle_started",
  "first_attack",
  "phase_two_reached",
  "rage_activated",
  "boss_defeated",
  "round_released",
  "summary_viewed",
  "share_started",
  "share_completed",
  "mood_better",
  "mood_same",
  "mood_worse",
  "replay_started",
  "daily_boss_opened",
  "challenge_opened",
  "collection_opened",
  "unlock_earned",
] as const;

export type LocalAnalyticsEvent = typeof LOCAL_ANALYTICS_EVENTS[number];

export const FUNNEL_MILESTONES = [
  "app_opened",
  "generation_started",
  "monster_revealed",
  "battle_started",
  "first_attack",
  "summary_viewed",
  "share_completed",
  "replay_started",
] as const satisfies readonly LocalAnalyticsEvent[];

export type FunnelMilestone = typeof FUNNEL_MILESTONES[number];

export interface LocalEventCounter {
  count: number;
  firstDateKey: string;
  lastDateKey: string;
}

interface StoredLocalAnalytics {
  schemaVersion: typeof ANALYTICS_SCHEMA_VERSION;
  events: Partial<Record<LocalAnalyticsEvent, LocalEventCounter>>;
}

export interface FunnelStep {
  event: FunnelMilestone;
  reached: boolean;
  count: number;
  firstDateKey?: string;
}

export interface LocalAnalyticsSnapshot extends StoredLocalAnalytics {
  funnel: FunnelStep[];
  totalEvents: number;
}

function getBrowserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function isKnownEvent(value: string): value is LocalAnalyticsEvent {
  return (LOCAL_ANALYTICS_EVENTS as readonly string[]).includes(value);
}

function emptyAnalytics(): StoredLocalAnalytics {
  return { schemaVersion: ANALYTICS_SCHEMA_VERSION, events: {} };
}

function normalizeCounter(value: unknown): LocalEventCounter | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.count !== "number" || !Number.isFinite(record.count)
    || !isUtcDateKey(record.firstDateKey) || !isUtcDateKey(record.lastDateKey)) return null;
  return {
    count: Math.max(0, Math.min(MAX_COUNT, Math.round(record.count))),
    firstDateKey: record.firstDateKey,
    lastDateKey: record.lastDateKey,
  };
}

function readStoredAnalytics(storage = getBrowserStorage()): StoredLocalAnalytics {
  if (!storage) return emptyAnalytics();
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "null") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyAnalytics();
    const record = parsed as Record<string, unknown>;
    if (record.schemaVersion !== ANALYTICS_SCHEMA_VERSION
      || !record.events || typeof record.events !== "object" || Array.isArray(record.events)) {
      return emptyAnalytics();
    }
    const events: StoredLocalAnalytics["events"] = {};
    for (const [event, counter] of Object.entries(record.events as Record<string, unknown>)) {
      if (!isKnownEvent(event)) continue;
      const normalized = normalizeCounter(counter);
      if (normalized) events[event] = normalized;
    }
    return { schemaVersion: ANALYTICS_SCHEMA_VERSION, events };
  } catch {
    return emptyAnalytics();
  }
}

function snapshot(stored: StoredLocalAnalytics): LocalAnalyticsSnapshot {
  const funnel = FUNNEL_MILESTONES.map((event) => {
    const counter = stored.events[event];
    return {
      event,
      reached: Boolean(counter?.count),
      count: counter?.count ?? 0,
      ...(counter ? { firstDateKey: counter.firstDateKey } : {}),
    };
  });
  return {
    ...stored,
    funnel,
    totalEvents: Object.values(stored.events).reduce((sum, counter) => sum + (counter?.count ?? 0), 0),
  };
}

export function readLocalAnalytics(): LocalAnalyticsSnapshot {
  return snapshot(readStoredAnalytics());
}

/** Stable empty view for the server and first client render. */
export function createEmptyLocalAnalyticsSnapshot(): LocalAnalyticsSnapshot {
  return snapshot(emptyAnalytics());
}

/** Stores only allowlisted aggregate counters and UTC date keys, never event payloads or identifiers. */
export function trackLocalEvent(
  event: LocalAnalyticsEvent,
  date: Date | string = new Date(),
): LocalAnalyticsSnapshot {
  const stored = readStoredAnalytics();
  if (!isKnownEvent(event)) return snapshot(stored);
  const dateKey = getUtcDateKey(date);
  const previous = stored.events[event];
  const next: StoredLocalAnalytics = {
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    events: {
      ...stored.events,
      [event]: {
        count: Math.min(MAX_COUNT, (previous?.count ?? 0) + 1),
        firstDateKey: previous?.firstDateKey ?? dateKey,
        lastDateKey: dateKey,
      },
    },
  };
  try {
    getBrowserStorage()?.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Analytics is optional and never blocks gameplay.
  }
  return snapshot(next);
}

export function exportLocalAnalytics(): string {
  const current = readLocalAnalytics();
  return JSON.stringify({
    schemaVersion: current.schemaVersion,
    totalEvents: current.totalEvents,
    events: current.events,
    funnel: current.funnel,
    privacy: "Local-only aggregate counters; no vent text, event payloads, user IDs, or session IDs.",
  }, null, 2);
}

export function clearLocalAnalytics(): LocalAnalyticsSnapshot {
  try {
    getBrowserStorage()?.removeItem(STORAGE_KEY);
  } catch {
    // Return the empty in-memory view even if browser storage is unavailable.
  }
  return snapshot(emptyAnalytics());
}
