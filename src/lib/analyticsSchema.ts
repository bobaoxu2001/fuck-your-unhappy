/**
 * Remote PMF analytics schema — the single source of truth for every
 * anonymous event Unhappy Buster sends to its own /api/analytics endpoint.
 *
 * Privacy boundary (hard rules):
 * - Only the six allowlisted event names below are accepted.
 * - Event properties may ONLY be enum values from the lists below.
 *   Raw/redacted vent text, prompts, names, share text, AI output, and any
 *   other free-form content are structurally impossible to send: the
 *   validator rejects unknown property keys and non-enum values.
 * - Install/session IDs are random UUIDs, never PII.
 * - UTM values are normalized to [a-z0-9._-] and capped at 48 chars.
 */

export const ANALYTICS_SCHEMA_VERSION = 1 as const;

export const REMOTE_EVENT_NAMES = [
  "visit",
  "start",
  "boss_revealed",
  "arena_started",
  "arena_completed",
  "share",
] as const;
export type RemoteEventName = (typeof REMOTE_EVENT_NAMES)[number];

export const BOSS_SOURCES = ["daily", "custom", "challenge", "scenario"] as const;
export type BossSource = (typeof BOSS_SOURCES)[number];

export const GENERATION_MODES = ["live_ai", "curated_fallback"] as const;
export type GenerationMode = (typeof GENERATION_MODES)[number];

export const ENTRY_TYPES = ["organic", "daily", "challenge", "custom"] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ARENA_RESULTS = ["defeated", "released", "named"] as const;
export type ArenaResult = (typeof ARENA_RESULTS)[number];

export const DURATION_BUCKETS = ["under_10", "10_to_20", "20_to_30", "over_30"] as const;
export type DurationBucket = (typeof DURATION_BUCKETS)[number];

export const SHARE_CHANNELS = ["native", "download"] as const;
export type ShareChannel = (typeof SHARE_CHANNELS)[number];

export interface WireAnalyticsEvent {
  v: typeof ANALYTICS_SCHEMA_VERSION;
  /** Anonymous installation ID (random UUID, stored locally). */
  i: string;
  /** Anonymous per-tab session ID (random UUID, stored in sessionStorage). */
  s: string;
  e: RemoteEventName;
  us?: string;
  um?: string;
  uc?: string;
  p?: Record<string, string>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuidFormat(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

const UTM_VALUE_PATTERN = /^[a-z0-9._-]+$/;

/** Lowercase, strip every character outside [a-z0-9._-], cap length. */
export function normalizeUtmValue(raw: unknown, maxLength = 48): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "")
    .replace(/^[._-]+|[._-]+$/g, "");
  if (!cleaned || !UTM_VALUE_PATTERN.test(cleaned)) return null;
  return cleaned.slice(0, maxLength);
}

interface PropSpec {
  allowed: readonly string[];
  required: readonly string[];
  enums: Partial<Record<string, readonly string[]>>;
}

const PROP_SPECS: Record<RemoteEventName, PropSpec> = {
  visit: { allowed: [], required: [], enums: {} },
  start: {
    allowed: ["entry_type"],
    required: ["entry_type"],
    enums: { entry_type: ENTRY_TYPES },
  },
  boss_revealed: {
    allowed: ["boss_source", "generation_mode"],
    required: ["boss_source"],
    enums: { boss_source: BOSS_SOURCES, generation_mode: GENERATION_MODES },
  },
  arena_started: {
    allowed: ["boss_source", "generation_mode"],
    required: ["boss_source"],
    enums: { boss_source: BOSS_SOURCES, generation_mode: GENERATION_MODES },
  },
  arena_completed: {
    allowed: ["boss_source", "generation_mode", "result", "duration_bucket"],
    required: ["boss_source", "result", "duration_bucket"],
    enums: {
      boss_source: BOSS_SOURCES,
      generation_mode: GENERATION_MODES,
      result: ARENA_RESULTS,
      duration_bucket: DURATION_BUCKETS,
    },
  },
  share: {
    allowed: ["channel"],
    required: ["channel"],
    enums: { channel: SHARE_CHANNELS },
  },
};

/**
 * Strictly validates one wire event. Any unknown key, non-enum value, or
 * malformed identifier rejects the whole event so no free-form content can
 * ever ride along under an unknown property name.
 */
export function validateAnalyticsEvent(raw: unknown): WireAnalyticsEvent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const record = raw as Record<string, unknown>;
  if (record.v !== ANALYTICS_SCHEMA_VERSION) return null;
  if (!isUuidFormat(record.i) || !isUuidFormat(record.s)) return null;
  if (typeof record.e !== "string" || !(REMOTE_EVENT_NAMES as readonly string[]).includes(record.e)) return null;
  const event = record.e as RemoteEventName;

  const result: WireAnalyticsEvent = {
    v: ANALYTICS_SCHEMA_VERSION,
    i: record.i,
    s: record.s,
    e: event,
  };

  for (const key of ["us", "um", "uc"] as const) {
    const value = record[key];
    if (value === undefined) continue;
    if (typeof value !== "string" || normalizeUtmValue(value) !== value) return null;
    result[key] = value;
  }

  const spec = PROP_SPECS[event];
  if (record.p === undefined) {
    if (spec.required.length > 0) return null;
  } else {
    if (!record.p || typeof record.p !== "object" || Array.isArray(record.p)) return null;
    const props = record.p as Record<string, unknown>;
    if (Object.keys(props).some((key) => !spec.allowed.includes(key))) return null;
    for (const required of spec.required) {
      if (!(required in props)) return null;
    }
    const normalizedProps: Record<string, string> = {};
    for (const [key, value] of Object.entries(props)) {
      if (typeof value !== "string") return null;
      const allowedValues = spec.enums[key];
      if (allowedValues && !(allowedValues as readonly string[]).includes(value)) return null;
      normalizedProps[key] = value;
    }
    result.p = normalizedProps;
  }
  return result;
}

export interface Acquisition {
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface BuildAnalyticsEventArgs {
  installId: string;
  sessionId: string;
  event: RemoteEventName;
  props?: Record<string, string>;
  acq?: Acquisition;
}

/** Client-side builder; runs through the same strict validator as the server. */
export function buildAnalyticsEvent(args: BuildAnalyticsEventArgs): WireAnalyticsEvent | null {
  const raw: Record<string, unknown> = {
    v: ANALYTICS_SCHEMA_VERSION,
    i: args.installId,
    s: args.sessionId,
    e: args.event,
  };
  const source = args.acq?.source ? normalizeUtmValue(args.acq.source) : null;
  const medium = args.acq?.medium ? normalizeUtmValue(args.acq.medium) : null;
  const campaign = args.acq?.campaign ? normalizeUtmValue(args.acq.campaign) : null;
  if (source) raw.us = source;
  if (medium) raw.um = medium;
  if (campaign) raw.uc = campaign;
  if (args.props && Object.keys(args.props).length > 0) raw.p = { ...args.props };
  return validateAnalyticsEvent(raw);
}

export function getDurationBucket(elapsedSeconds: number): DurationBucket {
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0) return "under_10";
  if (elapsedSeconds < 10) return "under_10";
  if (elapsedSeconds < 20) return "10_to_20";
  if (elapsedSeconds < 30) return "20_to_30";
  return "over_30";
}

export const MAX_BATCH_EVENTS = 50;

/** A batch is all-or-nothing: one invalid event drops the whole batch. */
export function validateEventBatch(body: unknown): WireAnalyticsEvent[] | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const events = (body as Record<string, unknown>).events;
  if (!Array.isArray(events) || events.length < 1 || events.length > MAX_BATCH_EVENTS) return null;
  const validated: WireAnalyticsEvent[] = [];
  for (const event of events) {
    const valid = validateAnalyticsEvent(event);
    if (!valid) return null;
    validated.push(valid);
  }
  return validated;
}
