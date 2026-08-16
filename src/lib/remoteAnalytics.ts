/**
 * Remote PMF analytics — client instrumentation.
 *
 * - Opt-in only: nothing is ever sent unless the build has
 *   NEXT_PUBLIC_ANALYTICS_ENABLED=true (set only in Vercel Production).
 * - Anonymous random UUID install ID (localStorage) + per-tab session ID
 *   (sessionStorage). No cookies, no fingerprinting, no accounts.
 * - "visit" and "start" fire at most once per session (Flow E: reloads do
 *   not produce duplicate activation events).
 * - Analytics must fail open: every failure path is swallowed so gameplay
 *   is never affected.
 */
import {
  Acquisition,
  ArenaResult,
  BossSource,
  BuildAnalyticsEventArgs,
  DurationBucket,
  EntryType,
  GenerationMode,
  RemoteEventName,
  ShareChannel,
  WireAnalyticsEvent,
  buildAnalyticsEvent,
  isUuidFormat,
  normalizeUtmValue,
} from "./analyticsSchema";

const INSTALL_KEY = "unhappy-buster-install-v1";
const SESSION_KEY = "unhappy-buster-session-v1";
const ACQ_KEY = "unhappy-buster-acq-v1";
const VISIT_FLAG = "fyu:analytics:visit-sent";
const START_FLAG = "fyu:analytics:start-sent";
const ENDPOINT = "/api/analytics";

export type RemoteEventSpec =
  | { event: "visit" }
  | { event: "start"; entryType: EntryType }
  | { event: "boss_revealed"; bossSource: BossSource; generationMode?: GenerationMode }
  | { event: "arena_started"; bossSource: BossSource; generationMode?: GenerationMode }
  | {
      event: "arena_completed";
      bossSource: BossSource;
      generationMode?: GenerationMode;
      result: ArenaResult;
      durationBucket: DurationBucket;
    }
  | { event: "share"; channel: ShareChannel };

export interface TrackDeps {
  local?: Storage | null;
  session?: Storage | null;
  fetchImpl?: typeof fetch;
  search?: string;
  endpoint?: string;
}

export function isRemoteAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true";
}

function browserStorage(kind: "local" | "session"): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Random UUID v4 from the platform CSPRNG. Never derived from any user data. */
export function newRandomId(): string | null {
  try {
    if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto !== "undefined" && typeof globalThis.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      bytes[6] = (bytes[6] & 0x0f) | 0x40;
      bytes[8] = (bytes[8] & 0x3f) | 0x80;
      const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      return (
        hex.slice(0, 8) + "-" +
        hex.slice(8, 12) + "-" +
        hex.slice(12, 16) + "-" +
        hex.slice(16, 20) + "-" +
        hex.slice(20)
      );
    }
    return null;
  } catch {
    return null;
  }
}

export function getInstallId(storage: Storage | null = browserStorage("local")): string | null {
  if (!storage) return null;
  try {
    const existing = storage.getItem(INSTALL_KEY);
    if (existing && isUuidFormat(existing)) return existing;
    const next = newRandomId();
    if (!next) return null;
    storage.setItem(INSTALL_KEY, next);
    return next;
  } catch {
    return null;
  }
}

export function getSessionId(storage: Storage | null = browserStorage("session")): string | null {
  if (!storage) return null;
  try {
    const existing = storage.getItem(SESSION_KEY);
    if (existing && isUuidFormat(existing)) return existing;
    const next = newRandomId();
    if (!next) return null;
    storage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return null;
  }
}

export function readStoredAcquisition(storage: Storage | null): Acquisition {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(ACQ_KEY) ?? "null") as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const record = parsed as Record<string, unknown>;
    const source = typeof record.source === "string" ? normalizeUtmValue(record.source) : null;
    const medium = typeof record.medium === "string" ? normalizeUtmValue(record.medium) : null;
    const campaign = typeof record.campaign === "string" ? normalizeUtmValue(record.campaign) : null;
    return {
      ...(source ? { source } : {}),
      ...(medium ? { medium } : {}),
      ...(campaign ? { campaign } : {}),
    };
  } catch {
    return {};
  }
}

/**
 * If the URL carries utm params, persist them (overwrite) for this install;
 * otherwise return the previously stored acquisition so return visits keep
 * their last-known source.
 */
export function captureAcquisitionFromUrl(
  search: string,
  storage: Storage | null = browserStorage("local"),
): Acquisition {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  } catch {
    params = new URLSearchParams();
  }
  const incoming: Acquisition = {};
  const source = normalizeUtmValue(params.get("utm_source"));
  const medium = normalizeUtmValue(params.get("utm_medium"));
  const campaign = normalizeUtmValue(params.get("utm_campaign"));
  if (source) incoming.source = source;
  if (medium) incoming.medium = medium;
  if (campaign) incoming.campaign = campaign;
  if (Object.keys(incoming).length > 0) {
    try {
      storage?.setItem(ACQ_KEY, JSON.stringify(incoming));
    } catch {
      // In-memory only; storage may be unavailable.
    }
    return incoming;
  }
  return readStoredAcquisition(storage);
}

function hasSessionFlag(storage: Storage | null, key: string): boolean {
  try {
    return storage?.getItem(key) === "1";
  } catch {
    return false;
  }
}

function setSessionFlag(storage: Storage | null, key: string): void {
  try {
    storage?.setItem(key, "1");
  } catch {
    // Optional dedupe only; never required for gameplay.
  }
}

/** Never rejects: any network/provider failure is swallowed. */
export async function flushAnalyticsEvent(
  payload: WireAnalyticsEvent,
  fetchImpl: typeof fetch = fetch,
  endpoint: string = ENDPOINT,
): Promise<void> {
  try {
    await fetchImpl(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: [payload] }),
      keepalive: true,
      cache: "no-store",
    });
  } catch {
    // Analytics must fail open — the game always works without it.
  }
}

function propsFromSpec(spec: RemoteEventSpec): Record<string, string> | undefined {
  switch (spec.event) {
    case "visit":
      return undefined;
    case "start":
      return { entry_type: spec.entryType };
    case "boss_revealed":
      return spec.generationMode
        ? { boss_source: spec.bossSource, generation_mode: spec.generationMode }
        : { boss_source: spec.bossSource };
    case "arena_started":
      return spec.generationMode
        ? { boss_source: spec.bossSource, generation_mode: spec.generationMode }
        : { boss_source: spec.bossSource };
    case "arena_completed":
      return {
        boss_source: spec.bossSource,
        ...(spec.generationMode ? { generation_mode: spec.generationMode } : {}),
        result: spec.result,
        duration_bucket: spec.durationBucket,
      };
    case "share":
      return { channel: spec.channel };
  }
}

/**
 * Fire an anonymous product event. visit/start are deduped per session;
 * everything else is validated against the strict schema and silently
 * dropped when invalid. Never throws.
 */
export function trackRemoteEvent(spec: RemoteEventSpec, deps: TrackDeps = {}): void {
  if (!isRemoteAnalyticsEnabled()) return;
  try {
    const local = deps.local !== undefined ? deps.local : browserStorage("local");
    const session = deps.session !== undefined ? deps.session : browserStorage("session");
    if (!local || !session) return;
    if (spec.event === "visit" && hasSessionFlag(session, VISIT_FLAG)) return;
    if (spec.event === "start" && hasSessionFlag(session, START_FLAG)) return;

    const installId = getInstallId(local);
    const sessionId = getSessionId(session);
    if (!installId || !sessionId) return;

    const search = deps.search ?? (typeof window !== "undefined" ? window.location.search : "");
    const acq = captureAcquisitionFromUrl(search, local);
    const args: BuildAnalyticsEventArgs = {
      installId,
      sessionId,
      event: spec.event,
      props: propsFromSpec(spec),
      acq,
    };
    const payload = buildAnalyticsEvent(args);
    if (!payload) return;

    if (spec.event === "visit") setSessionFlag(session, VISIT_FLAG);
    if (spec.event === "start") setSessionFlag(session, START_FLAG);
    void flushAnalyticsEvent(payload, deps.fetchImpl ?? fetch, deps.endpoint ?? ENDPOINT);
  } catch {
    // Never break gameplay.
  }
}

/**
 * Called by the "Clear data" control so a user can reset their anonymous
 * identifiers. Remote aggregate counters already sent remain aggregate
 * counters; future events start under a fresh random ID.
 */
export function resetRemoteIdentity(
  local: Storage | null = browserStorage("local"),
  session: Storage | null = browserStorage("session"),
): void {
  for (const storage of [local, session]) {
    if (!storage) continue;
    try {
      storage.removeItem(INSTALL_KEY);
      storage.removeItem(SESSION_KEY);
      storage.removeItem(ACQ_KEY);
      storage.removeItem(VISIT_FLAG);
      storage.removeItem(START_FLAG);
    } catch {
      // Storage may be unavailable in private browsing.
    }
  }
}

export type { RemoteEventName };
