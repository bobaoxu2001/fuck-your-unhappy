import type { NextRequest } from "next/server";

interface GateState {
  count: number;
  resetAt: number;
}

interface GateOptions {
  bucket: string;
  limit: number;
  windowMs: number;
}

export const MAX_GATE_BUCKETS = 5_000;
const requestBuckets = new Map<string, GateState>();

function clientKey(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || req.headers.get("x-real-ip") || "unknown";
}

export function resetRequestGates() {
  requestBuckets.clear();
}

/**
 * Best-effort keyed gate used by tests and by the request wrapper.
 * Production should also enforce a durable edge/provider limit because
 * serverless instances do not share this memory.
 */
export function checkKeyedGate(key: string, options: GateOptions, now = Date.now()) {
  const current = requestBuckets.get(key);
  const state = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + options.windowMs }
    : { count: current.count + 1, resetAt: current.resetAt };
  requestBuckets.set(key, state);

  if (requestBuckets.size > MAX_GATE_BUCKETS) {
    for (const [bucketKey, bucketState] of requestBuckets) {
      if (bucketState.resetAt <= now) requestBuckets.delete(bucketKey);
      if (requestBuckets.size <= MAX_GATE_BUCKETS) break;
    }
  }

  return {
    allowed: state.count <= options.limit,
    retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1_000)),
  };
}

type DurableGateEnv = Record<string, string | undefined>;

export async function checkUpstashGate(
  key: string,
  options: GateOptions,
  env: DurableGateEnv = process.env,
  fetchImpl: typeof fetch = fetch,
) {
  const baseUrl = env.UPSTASH_REDIS_REST_URL?.replace(/\/$/, "");
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  if (!baseUrl || !token) return null;

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1_000));
  try {
    const response = await fetchImpl(`${baseUrl}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, windowSeconds, "NX"],
        ["PTTL", key],
      ]),
      cache: "no-store",
    });
    if (!response.ok) return null;

    const payload = await response.json() as Array<{ result?: unknown }>;
    const count = typeof payload[0]?.result === "number" ? payload[0].result : NaN;
    const pttl = typeof payload[2]?.result === "number" ? payload[2].result : options.windowMs;
    if (!Number.isFinite(count)) return null;

    return {
      allowed: count <= options.limit,
      retryAfterSeconds: Math.max(1, Math.ceil(Math.max(pttl, 0) / 1_000)),
    };
  } catch {
    return null;
  }
}

/**
 * Prefer a shared Upstash counter when configured so serverless instances
 * share one budget. Falls back to the in-memory gate on this instance.
 */
export async function checkRequestGate(
  req: NextRequest,
  options: GateOptions,
  env: DurableGateEnv = process.env,
  fetchImpl: typeof fetch = fetch,
) {
  const key = `${options.bucket}:${clientKey(req)}`;
  return await checkUpstashGate(key, options, env, fetchImpl) ?? checkKeyedGate(key, options);
}
