/**
 * PMF report computation over the anonymous analytics store.
 *
 * Pure and storage-agnostic: everything reads through a StoreReader whose
 * pipeline accepts raw Redis-style commands, so unit tests can run the full
 * write-pipeline -> report round trip against an in-memory fake.
 *
 * Retention semantics (UTC days, anchored to completed fights):
 * - D1: of installs completing on day X, share also completing on day X+1.
 * - D7: of installs completing on day X, share also completing on any of
 *   days X+6 .. X+8.
 * - North star: installs completing on 2+ distinct days in the last 7 days.
 * - Second fight: sessions (per-tab session IDs) with 2+ completions in a day.
 */
import {
  ARENA_RESULTS,
  BOSS_SOURCES,
  DURATION_BUCKETS,
  ENTRY_TYPES,
  GENERATION_MODES,
  REMOTE_EVENT_NAMES,
  SHARE_CHANNELS,
} from "./analyticsSchema";
import {
  FIRST_SEEN_KEY,
  SOURCES_KEY,
  SOURCE_UNKNOWN,
  StoreReader,
  compKey,
  compSrcKey,
  dailyCounterKey,
  secondFightKey,
} from "./analyticsStorage";

export function addDays(dayKey: string, delta: number): string {
  const date = new Date(dayKey + "T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

/** Ascending list of UTC day keys ending at todayKey (length days). */
export function utcDayKeysBack(todayKey: string, days: number): string[] {
  const list: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    list.push(addDays(todayKey, -offset));
  }
  return list;
}

function pct(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) return null;
  return Math.round((numerator / denominator) * 1000) / 10;
}

function toCount(value: unknown): number {
  const count = typeof value === "number" ? value : Number(value);
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
}

function intersectSize(a: Set<string> | undefined, b: Set<string> | undefined): number {
  if (!a || !b || a.size === 0 || b.size === 0) return 0;
  const pair = a.size <= b.size ? [a, b] : [b, a];
  const small = pair[0];
  const large = pair[1];
  let count = 0;
  for (const member of small) {
    if (large.has(member)) count += 1;
  }
  return count;
}

interface ScanSpec {
  kind: "SSCAN" | "HSCAN";
  key: string;
}

/** Cursor-safe batched scan; returns raw item lists per key (HSCAN = flat pairs). */
async function scanAll(read: StoreReader, specs: ScanSpec[]): Promise<Map<string, string[]>> {
  const collected = new Map<string, string[]>();
  const cursors = new Map<string, string>();
  for (const spec of specs) cursors.set(spec.key, "");
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const pending = specs.filter((spec) => cursors.get(spec.key) !== "0");
    if (pending.length === 0) break;
    const results = await read.pipeline(
      pending.map((spec) => [spec.kind, spec.key, cursors.get(spec.key) ?? "0"]),
    );
    let remaining = 0;
    results.forEach((result, index) => {
      const spec = pending[index];
      const items = collected.get(spec.key) ?? [];
      let cursor = "0";
      if (Array.isArray(result) && result.length >= 1 && typeof result[0] === "string") {
        cursor = result[0];
        const rawItems = result[1];
        if (Array.isArray(rawItems)) {
          for (const item of rawItems) {
            if (typeof item === "string") items.push(item);
          }
        }
      }
      collected.set(spec.key, items);
      cursors.set(spec.key, cursor);
      if (cursor !== "0") remaining += 1;
    });
    if (remaining === 0) break;
  }
  return collected;
}

export interface PmfDailyRow {
  day: string;
  visitors: number;
  starts: number;
  boss_revealed: number;
  arena_started: number;
  arena_completed: number;
  shares: number;
  first_time_visitors: number;
  second_fight_sessions: number;
}

export interface PmfReport {
  generated_at: string;
  window_days: number;
  today_utc: string;
  definitions: Record<string, string>;
  daily: PmfDailyRow[];
  funnel: {
    visitors: number;
    starts: number;
    boss_revealed: number;
    arena_started: number;
    arena_completed: number;
    shares: number;
    first_time_visitors: number;
    unique_completers: number;
    second_fight_sessions: number;
    activation_first_visitors_pct: number | null;
    activation_events_vs_first_visitors_pct: number | null;
    activation_vs_starts_pct: number | null;
    boss_reveal_rate_pct: number | null;
    arena_start_rate_pct: number | null;
    arena_completion_rate_pct: number | null;
    share_rate_pct: number | null;
  };
  retention: {
    d1: { eligible: number; returned: number; pct: number | null } | null;
    d7: { eligible: number; returned: number; pct: number | null } | null;
  };
  north_star: { window_days: number; users_with_2plus_days: number };
  by_utm_source: Array<{
    source: string;
    completes_user_days: number;
    d1_eligible: number;
    d1_returned: number;
    d1_pct: number | null;
  }>;
  by_boss_source: Array<{
    boss_source: string;
    arena_started: number;
    arena_completed: number;
    completion_rate_pct: number | null;
  }>;
  by_generation_mode: Array<{
    generation_mode: string;
    arena_started: number;
    arena_completed: number;
    completion_rate_pct: number | null;
  }>;
  by_result: Array<{ result: string; arena_completed: number }>;
  by_share_channel: Array<{ channel: string; shares: number }>;
}

const COUNTER_EVENTS = ["visit", "start", "boss_revealed", "arena_started", "arena_completed", "share"] as const;
const DIMENSION_EVENTS = ["boss_revealed", "arena_started", "arena_completed"] as const;
const MAX_SOURCES = 40;

export async function computePmfReport(
  read: StoreReader,
  options: { days: number; todayKey: string; now?: Date },
): Promise<PmfReport> {
  const days = utcDayKeysBack(options.todayKey, options.days);
  const generatedAt = options.now ?? new Date();

  // Phase 1: counters + metadata
  const phase1: Array<ReadonlyArray<string | number>> = [];
  const counterIndex = new Map<string, number>();
  const indexOf = (commands: Array<ReadonlyArray<string | number>>, ...args: (string | number)[]) => {
    counterIndex.set(args.join(":"), commands.length);
    commands.push(args);
  };

  for (const day of days) {
    for (const event of COUNTER_EVENTS) indexOf(phase1, "GET", dailyCounterKey(day, event));
    for (const event of DIMENSION_EVENTS) {
      for (const source of BOSS_SOURCES) indexOf(phase1, "GET", dailyCounterKey(day, event) + ":" + source);
      for (const mode of GENERATION_MODES) indexOf(phase1, "GET", dailyCounterKey(day, event) + ":" + mode);
    }
    for (const result of ARENA_RESULTS) indexOf(phase1, "GET", dailyCounterKey(day, "arena_completed") + ":" + result);
    for (const channel of SHARE_CHANNELS) indexOf(phase1, "GET", dailyCounterKey(day, "share") + ":" + channel);
    indexOf(phase1, "ZCOUNT", secondFightKey(day), 2, "+inf");
  }
  indexOf(phase1, "SMEMBERS", SOURCES_KEY);

  const phase1Results = await read.pipeline(phase1);
  const counter = (key: string) => toCount(phase1Results[counterIndex.get("GET:" + key) ?? -1]);
  const counterAt = (args: (string | number)[]) => {
    const index = counterIndex.get(args.join(":")) ?? -1;
    return index >= 0 ? toCount(phase1Results[index]) : 0;
  };

  const rawSources = phase1Results[counterIndex.get("SMEMBERS:" + SOURCES_KEY) ?? -1] as unknown;
  const sourceSet = new Set<string>([SOURCE_UNKNOWN]);
  if (Array.isArray(rawSources)) {
    for (const value of rawSources) {
      if (typeof value === "string" && value && sourceSet.size < MAX_SOURCES) sourceSet.add(value);
    }
  }
  const sources = [...sourceSet];

  // Phase 2: scanned sets/hashes
  const scanSpecs: ScanSpec[] = days.map((day) => ({ kind: "SSCAN", key: compKey(day) }));
  for (const day of days) {
    for (const source of sources) {
      scanSpecs.push({ kind: "SSCAN", key: compSrcKey(day, source) });
    }
  }
  scanSpecs.push({ kind: "HSCAN", key: FIRST_SEEN_KEY });
  const scanned = await scanAll(read, scanSpecs);

  const compSets = new Map<string, Set<string>>();
  for (const day of days) compSets.set(day, new Set(scanned.get(compKey(day)) ?? []));

  const compSrcSets = new Map<string, Set<string>>();
  for (const day of days) {
    for (const source of sources) {
      compSrcSets.set(day + "|" + source, new Set(scanned.get(compSrcKey(day, source)) ?? []));
    }
  }

  const firstSeenPairs = scanned.get(FIRST_SEEN_KEY) ?? [];
  const firstSeenByInstall = new Map<string, string>();
  for (let i = 0; i + 1 < firstSeenPairs.length; i += 2) {
    firstSeenByInstall.set(firstSeenPairs[i], firstSeenPairs[i + 1]);
  }

  // Daily rows + funnel
  const funnel = {
    visitors: 0,
    starts: 0,
    boss_revealed: 0,
    arena_started: 0,
    arena_completed: 0,
    shares: 0,
    first_time_visitors: 0,
    unique_completers: 0,
    second_fight_sessions: 0,
  };
  const daily: PmfDailyRow[] = [];
  const uniqueCompleters = new Set<string>();

  for (const day of days) {
    const visitors = counterAt(["GET", dailyCounterKey(day, "visit")]);
    const starts = counterAt(["GET", dailyCounterKey(day, "start")]);
    const bossRevealed = counterAt(["GET", dailyCounterKey(day, "boss_revealed")]);
    const arenaStarted = counterAt(["GET", dailyCounterKey(day, "arena_started")]);
    const arenaCompleted = counterAt(["GET", dailyCounterKey(day, "arena_completed")]);
    const shares = counterAt(["GET", dailyCounterKey(day, "share")]);
    const secondFightSessions = counterAt(["ZCOUNT", secondFightKey(day), 2, "+inf"]);
    let firstTimeVisitors = 0;
    for (const firstDay of firstSeenByInstall.values()) {
      if (firstDay === day) firstTimeVisitors += 1;
    }
    const completers = compSets.get(day) ?? new Set<string>();
    for (const install of completers) uniqueCompleters.add(install);

    funnel.visitors += visitors;
    funnel.starts += starts;
    funnel.boss_revealed += bossRevealed;
    funnel.arena_started += arenaStarted;
    funnel.arena_completed += arenaCompleted;
    funnel.shares += shares;
    funnel.first_time_visitors += firstTimeVisitors;
    funnel.second_fight_sessions += secondFightSessions;

    daily.push({
      day,
      visitors,
      starts,
      boss_revealed: bossRevealed,
      arena_started: arenaStarted,
      arena_completed: arenaCompleted,
      shares,
      first_time_visitors: firstTimeVisitors,
      second_fight_sessions: secondFightSessions,
    });
  }
  funnel.unique_completers = uniqueCompleters.size;

  // Retention (D1 / D7)
  let d1Num = 0;
  let d1Den = 0;
  let d7Num = 0;
  let d7Den = 0;
  for (const day of days) {
    const completers = compSets.get(day) ?? new Set<string>();
    if (addDays(day, 1) <= options.todayKey) {
      d1Den += completers.size;
      d1Num += intersectSize(completers, compSets.get(addDays(day, 1)));
    }
    if (addDays(day, 8) <= options.todayKey) {
      const followUp = new Set<string>();
      for (const later of [addDays(day, 6), addDays(day, 7), addDays(day, 8)]) {
        const laterSet = compSets.get(later) ?? new Set<string>();
        for (const member of laterSet) followUp.add(member);
      }
      d7Den += completers.size;
      d7Num += intersectSize(completers, followUp);
    }
  }

  // North star: 2+ distinct completion days in the last 7 days
  const northStarDays = utcDayKeysBack(options.todayKey, 7);
  const daysByInstall = new Map<string, Set<string>>();
  for (const day of northStarDays) {
    const set = compSets.get(day) ?? new Set<string>();
    for (const install of set) {
      const installDays = daysByInstall.get(install) ?? new Set<string>();
      installDays.add(day);
      daysByInstall.set(install, installDays);
    }
  }
  let northStarUsers = 0;
  for (const installDays of daysByInstall.values()) {
    if (installDays.size >= 2) northStarUsers += 1;
  }

  // Acquisition / boss source / generation mode / result / channel
  const byUtmSource = sources.map((source) => {
    let completes = 0;
    let eligible = 0;
    let returned = 0;
    for (const day of days) {
      const completers = compSrcSets.get(day + "|" + source) ?? new Set<string>();
      completes += completers.size;
      if (addDays(day, 1) <= options.todayKey) {
        eligible += completers.size;
        returned += intersectSize(completers, compSrcSets.get(addDays(day, 1) + "|" + source));
      }
    }
    return {
      source,
      completes_user_days: completes,
      d1_eligible: eligible,
      d1_returned: returned,
      d1_pct: pct(returned, eligible),
    };
  });

  const byBossSource = BOSS_SOURCES.map((source) => {
    let started = 0;
    let completed = 0;
    for (const day of days) {
      started += counter(dailyCounterKey(day, "arena_started") + ":" + source);
      completed += counter(dailyCounterKey(day, "arena_completed") + ":" + source);
    }
    return {
      boss_source: source,
      arena_started: started,
      arena_completed: completed,
      completion_rate_pct: pct(completed, started),
    };
  });

  const byGenerationMode = GENERATION_MODES.map((mode) => {
    let started = 0;
    let completed = 0;
    for (const day of days) {
      started += counter(dailyCounterKey(day, "arena_started") + ":" + mode);
      completed += counter(dailyCounterKey(day, "arena_completed") + ":" + mode);
    }
    return {
      generation_mode: mode,
      arena_started: started,
      arena_completed: completed,
      completion_rate_pct: pct(completed, started),
    };
  });

  const byResult = ARENA_RESULTS.map((result) => {
    let completed = 0;
    for (const day of days) {
      completed += counter(dailyCounterKey(day, "arena_completed") + ":" + result);
    }
    return { result, arena_completed: completed };
  });

  const byShareChannel = SHARE_CHANNELS.map((channel) => {
    let shares = 0;
    for (const day of days) {
      shares += counter(dailyCounterKey(day, "share") + ":" + channel);
    }
    return { channel, shares };
  });

  return {
    generated_at: generatedAt.toISOString(),
    window_days: options.days,
    today_utc: options.todayKey,
    definitions: {
      visitors: "visit events = anonymous per-tab sessions",
      starts: "start events = sessions that explicitly began the loop (vent submit, scenario, daily boss, challenge)",
      first_time_visitors: "installs whose first event fell on that UTC day",
      activation_first_visitors_pct: "unique installs completing a fight / first-time visitors (window)",
      activation_vs_starts_pct: "arena_completed events / start events (window)",
      second_fight_sessions: "sessions with 2+ arena_completed events on the same UTC day",
      d1: "installs completing on day X that also completed on day X+1 / installs completing on day X",
      d7: "installs completing on day X that also completed on any of days X+6..X+8 / installs completing on day X",
      north_star: "installs completing on 2+ distinct UTC days within the last 7 days",
      by_boss_source: "daily | custom (typed vent) | challenge (challenge link) | scenario (one-tap prompt)",
      entry_types: ENTRY_TYPES.join(" | "),
      duration_buckets: DURATION_BUCKETS.join(" | "),
      event_names: REMOTE_EVENT_NAMES.join(" | "),
    },
    daily,
    funnel: {
      ...funnel,
      activation_first_visitors_pct: pct(funnel.unique_completers, funnel.first_time_visitors),
      activation_events_vs_first_visitors_pct: pct(funnel.arena_completed, funnel.first_time_visitors),
      activation_vs_starts_pct: pct(funnel.arena_completed, funnel.starts),
      boss_reveal_rate_pct: pct(funnel.boss_revealed, funnel.starts),
      arena_start_rate_pct: pct(funnel.arena_started, funnel.boss_revealed),
      arena_completion_rate_pct: pct(funnel.arena_completed, funnel.arena_started),
      share_rate_pct: pct(funnel.shares, funnel.arena_completed),
    },
    retention: {
      d1: d1Den > 0 ? { eligible: d1Den, returned: d1Num, pct: pct(d1Num, d1Den) } : null,
      d7: d7Den > 0 ? { eligible: d7Den, returned: d7Num, pct: pct(d7Num, d7Den) } : null,
    },
    north_star: { window_days: 7, users_with_2plus_days: northStarUsers },
    by_utm_source: byUtmSource,
    by_boss_source: byBossSource,
    by_generation_mode: byGenerationMode,
    by_result: byResult,
    by_share_channel: byShareChannel,
  };
}
