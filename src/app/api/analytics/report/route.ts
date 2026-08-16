/**
 * Founder-only PMF report endpoint.
 *
 * GET /api/analytics/report?key=ANALYTICS_REPORT_KEY&days=14
 *
 * Returns the minimum measurement view (daily funnel, retention, north star,
 * acquisition/boss-source/generation-mode breakdowns) as JSON computed
 * directly from the anonymous counters in the project's own Upstash store.
 * No dashboard, no warehouse, no third party.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getUtcDateKey } from "@/lib/dailyBoss";
import { computePmfReport } from "@/lib/pmfReport";
import { createUpstashStoreReader, getAnalyticsStoreEnv } from "@/lib/analyticsStorage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };
const MAX_DAYS = 60;

function safeKeyMatches(provided: string, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = createHash("sha256").update(provided).digest();
  const b = createHash("sha256").update(expected).digest();
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const reportKey = process.env.ANALYTICS_REPORT_KEY;
  if (!reportKey) {
    return NextResponse.json(
      { error: "Analytics report is not configured." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
  const url = new URL(req.url);
  const provided = url.searchParams.get("key") ?? "";
  if (!safeKeyMatches(provided, reportKey)) {
    return NextResponse.json({ error: "Not found." }, { status: 404, headers: NO_STORE_HEADERS });
  }

  const daysParam = Number(url.searchParams.get("days"));
  const days = Number.isFinite(daysParam) && daysParam >= 1
    ? Math.min(MAX_DAYS, Math.floor(daysParam))
    : 14;

  const env = getAnalyticsStoreEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Analytics storage is not configured." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const read = createUpstashStoreReader(env.baseUrl, env.token);
    const report = await computePmfReport(read, { days, todayKey: getUtcDateKey() });
    return NextResponse.json(report, { headers: NO_STORE_HEADERS });
  } catch {
    return NextResponse.json(
      { error: "Analytics storage is unavailable." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}
