/**
 * Anonymous analytics storage layout on the project's own Upstash Redis
 * (same store the optional AI rate-limit gate already uses, different
 * "fyua:" key prefix).
 *
 * Keys:
 * - fyua:d:<yyyymmdd>:<event>                    daily event counters
 *   (plus :<boss_source> | :<generation_mode> | :<result> | :<channel>
 *    sub-counters for bounded product-state dimensions)
 * - fyua:firstseen                               hash: installId -> first UTC day
 * - fyua:src                                     hash: installId -> "source|medium|campaign" (last seen)
 * - fyua:sources                                 set: every utm_source ever seen
 * - fyua:comp:<yyyymmdd>                         set: installs completing that day
 * - fyua:compsrc:<yyyymmdd>:<utm_source>         set: installs completing that day per source
 * - fyua:cs:<yyyymmdd>                           zset: sessionId -> completions that day
 *
 * Daily keys self-expire after 95 days. Nothing here stores content — only
 * allowlisted enum values, random IDs, and UTC day keys.
 */
import { getUtcDateKey } from "./dailyBoss";
import { WireAnalyticsEvent } from "./analyticsSchema";

export const ANALYTICS_KEY_PREFIX = "fyua:";
export const ANALYTICS_RETENTION_SECONDS = 95 * 86_400;
export const SOURCE_UNKNOWN = "none";

export function dailyCounterKey(day: string, event: string): string {
  return ANALYTICS_KEY_PREFIX + "d:" + day + ":" + event;
}

export function compKey(day: string): string {
  return ANALYTICS_KEY_PREFIX + "comp:" + day;
}

export function compSrcKey(day: string, source: string): string {
  return ANALYTICS_KEY_PREFIX + "compsrc:" + day + ":" + source;
}

export function secondFightKey(day: string): string {
  return ANALYTICS_KEY_PREFIX + "cs:" + day;
}

export const FIRST_SEEN_KEY = ANALYTICS_KEY_PREFIX + "firstseen";
export const FIRST_SOURCE_KEY = ANALYTICS_KEY_PREFIX + "src";
export const SOURCES_KEY = ANALYTICS_KEY_PREFIX + "sources";

export type RedisCommand = ReadonlyArray<string | number>;

export interface WritePlan {
  commands: RedisCommand[];
  completions: Array<{ event: WireAnalyticsEvent; hgetIndex: number; day: string }>;
}

export function eventSourceValue(event: WireAnalyticsEvent): string {
  if (!event.us) return SOURCE_UNKNOWN;
  return [event.us, event.um ?? "", event.uc ?? ""].join("|");
}

/** First source part of a stored fyua:src value, or the event's own utm. */
export function resolveCompletionSource(storedSource: unknown, event: WireAnalyticsEvent): string {
  if (typeof storedSource === "string" && storedSource.length > 0) {
    const source = storedSource.split("|")[0];
    if (source) return source;
  }
  return event.us ?? SOURCE_UNKNOWN;
}

/**
 * Pure builder for the stage-1 write pipeline of one batch. The route runs
 * it, then adds per-completion compsrc SADDs in stage 2 once the stored
 * source is known from the HGET results.
 */
export function buildWritePipeline(
  events: readonly WireAnalyticsEvent[],
  now: Date | string = new Date(),
): WritePlan {
  const day = getUtcDateKey(now);
  const commands: RedisCommand[] = [];
  const completions: WritePlan["completions"] = [];

  for (const event of events) {
    const base = dailyCounterKey(day, event.e);
    commands.push(["INCR", base]);
    commands.push(["EXPIRE", base, ANALYTICS_RETENTION_SECONDS]);
    commands.push(["HSETNX", FIRST_SEEN_KEY, event.i, day]);

    const props = event.p ?? {};
    if (props.boss_source) {
      commands.push(["INCR", base + ":" + props.boss_source]);
      commands.push(["EXPIRE", base + ":" + props.boss_source, ANALYTICS_RETENTION_SECONDS]);
    }
    if (props.generation_mode) {
      commands.push(["INCR", base + ":" + props.generation_mode]);
      commands.push(["EXPIRE", base + ":" + props.generation_mode, ANALYTICS_RETENTION_SECONDS]);
    }
    if (event.e === "share" && props.channel) {
      commands.push(["INCR", base + ":" + props.channel]);
      commands.push(["EXPIRE", base + ":" + props.channel, ANALYTICS_RETENTION_SECONDS]);
    }
    if (event.e === "arena_completed") {
      if (props.result) {
        commands.push(["INCR", base + ":" + props.result]);
        commands.push(["EXPIRE", base + ":" + props.result, ANALYTICS_RETENTION_SECONDS]);
      }
      commands.push(["SADD", compKey(day), event.i]);
      commands.push(["EXPIRE", compKey(day), ANALYTICS_RETENTION_SECONDS]);
      commands.push(["ZINCRBY", secondFightKey(day), 1, event.s]);
      commands.push(["EXPIRE", secondFightKey(day), ANALYTICS_RETENTION_SECONDS]);
      // First/last source attribution: read the stored source, then refresh
      // it when this event itself carries utm parameters.
      commands.push(["HGET", FIRST_SOURCE_KEY, event.i]);
      if (event.us) {
        commands.push(["HSET", FIRST_SOURCE_KEY, event.i, eventSourceValue(event)]);
      }
      completions.push({ event, hgetIndex: commands.length - (event.us ? 2 : 1), day });
    }
    if (event.us) {
      commands.push(["SADD", SOURCES_KEY, event.us]);
    }
  }
  return { commands, completions };
}

export interface StoreReader {
  pipeline(commands: ReadonlyArray<RedisCommand>): Promise<unknown[]>;
}

export interface AnalyticsStoreEnv {
  baseUrl: string;
  token: string;
}

export function getAnalyticsStoreEnv(
  env: Record<string, string | undefined> = process.env,
): AnalyticsStoreEnv | null {
  const rawUrl = env.UPSTASH_REDIS_REST_URL;
  if (!rawUrl) return null;
  const baseUrl = rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!token) return null;
  return { baseUrl, token };
}

/** Upstash REST pipeline wrapper; results map 1:1 to commands (errors -> null). */
export function createUpstashStoreReader(
  baseUrl: string,
  token: string,
  fetchImpl: typeof fetch = fetch,
): StoreReader {
  return {
    async pipeline(commands) {
      const response = await fetchImpl(baseUrl + "/pipeline", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commands),
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("Analytics store unavailable (" + response.status + ")");
      }
      const payload = (await response.json()) as Array<{ result?: unknown; error?: unknown }>;
      if (!Array.isArray(payload)) {
        throw new Error("Analytics store returned an unexpected payload");
      }
      return payload.map((entry) => (entry && entry.error === undefined ? entry.result ?? null : null));
    },
  };
}
