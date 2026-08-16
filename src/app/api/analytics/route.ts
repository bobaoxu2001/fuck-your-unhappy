/**
 * Anonymous PMF analytics ingestion (fail-open by design).
 *
 * - Only accepts batches of strictly validated allowlisted events; unknown
 *   keys, non-enum values, malformed IDs, or oversized bodies are dropped
 *   without side effects.
 * - Production-gated: nothing is stored unless
 *   NEXT_PUBLIC_ANALYTICS_ENABLED=true (development/preview builds never
 *   pollute production analytics) and Upstash storage is configured.
 * - Any storage/network failure returns 204 anyway: gameplay never depends
 *   on this route.
 */
import { NextRequest, NextResponse } from "next/server";
import { validateEventBatch } from "@/lib/analyticsSchema";
import {
  ANALYTICS_RETENTION_SECONDS,
  RedisCommand,
  buildWritePipeline,
  compSrcKey,
  createUpstashStoreReader,
  getAnalyticsStoreEnv,
  resolveCompletionSource,
} from "@/lib/analyticsStorage";
import { checkKeyedGate } from "@/lib/requestGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_384;
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

function noContent(): NextResponse {
  return new NextResponse(null, { status: 204, headers: NO_STORE_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== "true") return noContent();
    const env = getAnalyticsStoreEnv();
    if (!env) return noContent();

    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const gate = checkKeyedGate("analytics:" + forwarded, { bucket: "analytics", limit: 300, windowMs: 60_000 });
    if (!gate.allowed) return noContent();

    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return noContent();

    let batch: ReturnType<typeof validateEventBatch>;
    try {
      batch = validateEventBatch(JSON.parse(text));
    } catch {
      return noContent();
    }
    if (!batch) return noContent();

    const store = createUpstashStoreReader(env.baseUrl, env.token);
    const plan = buildWritePipeline(batch, new Date());
    const stage1Results = await store.pipeline(plan.commands);

    const stage2: RedisCommand[] = [];
    for (const completion of plan.completions) {
      const storedSource = stage1Results[completion.hgetIndex];
      const source = resolveCompletionSource(storedSource, completion.event);
      const key = compSrcKey(completion.day, source);
      stage2.push(["SADD", key, completion.event.i]);
      stage2.push(["EXPIRE", key, ANALYTICS_RETENTION_SECONDS]);
    }
    if (stage2.length > 0) {
      await store.pipeline(stage2);
    }
  } catch {
    // Analytics must fail open: never surface errors, never break gameplay.
  }
  return noContent();
}

export async function GET() {
  return new NextResponse(null, { status: 405, headers: NO_STORE_HEADERS });
}
