import { describe, expect, it } from "vitest";
import { buildAnalyticsEvent } from "./analyticsSchema";
import { computePmfReport } from "./pmfReport";
import {
  FakeRedisStore,
  TEST_SESSION_1,
  TEST_SESSION_2,
  TEST_SESSION_3,
  TEST_UUID_A,
  TEST_UUID_B,
  TEST_UUID_C,
  TEST_UUID_D,
  writeAnalyticsBatch,
} from "./analyticsTestUtils";

const TODAY = "2026-08-15";

function event(
  install: string,
  session: string,
  name: "visit" | "start" | "boss_revealed" | "arena_started" | "arena_completed" | "share",
  props: Record<string, string> | undefined,
  acq?: { source?: string; medium?: string; campaign?: string },
) {
  return buildAnalyticsEvent({ installId: install, sessionId: session, event: name, props, acq })!;
}

async function seed(store: FakeRedisStore) {
  const tiktok = { source: "tiktok", medium: "organic", campaign: "boss_of_the_day_01" };
  // A: tiktok, custom/live_ai — two fights on 08-10 (second fight), one on 08-11 (D1)
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_A, TEST_SESSION_1, "visit", undefined, tiktok),
    event(TEST_UUID_A, TEST_SESSION_1, "start", { entry_type: "organic" }, tiktok),
    event(TEST_UUID_A, TEST_SESSION_1, "boss_revealed", { boss_source: "custom", generation_mode: "live_ai" }, tiktok),
    event(TEST_UUID_A, TEST_SESSION_1, "arena_started", { boss_source: "custom", generation_mode: "live_ai" }, tiktok),
    event(TEST_UUID_A, TEST_SESSION_1, "arena_completed", { boss_source: "custom", generation_mode: "live_ai", result: "defeated", duration_bucket: "10_to_20" }, tiktok),
    event(TEST_UUID_A, TEST_SESSION_1, "arena_completed", { boss_source: "custom", generation_mode: "live_ai", result: "defeated", duration_bucket: "10_to_20" }, tiktok),
    event(TEST_UUID_A, TEST_SESSION_1, "share", { channel: "native" }, tiktok),
  ], new Date("2026-08-10T10:00:00.000Z"));
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_A, TEST_SESSION_2, "arena_started", { boss_source: "custom", generation_mode: "live_ai" }, tiktok),
    event(TEST_UUID_A, TEST_SESSION_2, "arena_completed", { boss_source: "custom", generation_mode: "live_ai", result: "defeated", duration_bucket: "20_to_30" }, tiktok),
  ], new Date("2026-08-11T10:00:00.000Z"));

  // B: reddit, daily boss — starts but never completes
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_B, TEST_SESSION_3, "visit", undefined, { source: "reddit", medium: "community" }),
    event(TEST_UUID_B, TEST_SESSION_3, "start", { entry_type: "daily" }, { source: "reddit", medium: "community" }),
    event(TEST_UUID_B, TEST_SESSION_3, "boss_revealed", { boss_source: "daily" }, { source: "reddit", medium: "community" }),
    event(TEST_UUID_B, TEST_SESSION_3, "arena_started", { boss_source: "daily" }, { source: "reddit", medium: "community" }),
  ], new Date("2026-08-10T12:00:00.000Z"));

  // C: no utm, challenge — completes 08-02 and 08-08 (D7 window)
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_C, TEST_SESSION_3, "visit", undefined),
    event(TEST_UUID_C, TEST_SESSION_3, "start", { entry_type: "challenge" }),
    event(TEST_UUID_C, TEST_SESSION_3, "boss_revealed", { boss_source: "challenge" }),
    event(TEST_UUID_C, TEST_SESSION_3, "arena_started", { boss_source: "challenge" }),
    event(TEST_UUID_C, TEST_SESSION_3, "arena_completed", { boss_source: "challenge", result: "defeated", duration_bucket: "under_10" }),
  ], new Date("2026-08-02T10:00:00.000Z"));
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_C, TEST_SESSION_3, "arena_completed", { boss_source: "challenge", result: "defeated", duration_bucket: "under_10" }),
  ], new Date("2026-08-08T10:00:00.000Z"));

  // D: scenario/live_ai — completes 08-14 and 08-15 (north star)
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_D, TEST_SESSION_2, "visit", undefined),
    event(TEST_UUID_D, TEST_SESSION_2, "start", { entry_type: "custom" }),
    event(TEST_UUID_D, TEST_SESSION_2, "boss_revealed", { boss_source: "scenario", generation_mode: "live_ai" }),
    event(TEST_UUID_D, TEST_SESSION_2, "arena_started", { boss_source: "scenario", generation_mode: "live_ai" }),
    event(TEST_UUID_D, TEST_SESSION_2, "arena_completed", { boss_source: "scenario", generation_mode: "live_ai", result: "named", duration_bucket: "over_30" }),
  ], new Date("2026-08-14T10:00:00.000Z"));
  await writeAnalyticsBatch(store, [
    event(TEST_UUID_D, TEST_SESSION_2, "arena_completed", { boss_source: "scenario", generation_mode: "live_ai", result: "named", duration_bucket: "over_30" }),
  ], new Date("2026-08-15T10:00:00.000Z"));
}

describe("PMF report round trip (write pipeline -> report)", () => {
  it("computes the funnel, retention, north star, and breakdowns", async () => {
    const store = new FakeRedisStore();
    await seed(store);
    const report = await computePmfReport(store, { days: 14, todayKey: TODAY, now: new Date("2026-08-15T12:00:00.000Z") });

    // Funnel volumes
    expect(report.funnel.visitors).toBe(4);
    expect(report.funnel.starts).toBe(4);
    expect(report.funnel.boss_revealed).toBe(4);
    expect(report.funnel.arena_started).toBe(5);
    expect(report.funnel.arena_completed).toBe(7);
    expect(report.funnel.shares).toBe(1);
    expect(report.funnel.first_time_visitors).toBe(4);
    expect(report.funnel.unique_completers).toBe(3);

    // Activation + funnel rates
    expect(report.funnel.activation_first_visitors_pct).toBe(75);
    expect(report.funnel.activation_events_vs_first_visitors_pct).toBe(175);
    expect(report.funnel.activation_vs_starts_pct).toBe(175);
    expect(report.funnel.boss_reveal_rate_pct).toBe(100);
    expect(report.funnel.arena_start_rate_pct).toBe(125);
    expect(report.funnel.arena_completion_rate_pct).toBe(140);
    expect(report.funnel.share_rate_pct).toBe(14.3);

    // Daily row spot check
    const day10 = report.daily.find((row) => row.day === "2026-08-10");
    expect(day10).toMatchObject({
      visitors: 2,
      starts: 2,
      boss_revealed: 2,
      arena_started: 2,
      arena_completed: 2,
      shares: 1,
      first_time_visitors: 2,
      second_fight_sessions: 1,
    });

    // Second fight
    expect(report.funnel.second_fight_sessions).toBe(1);

    // Retention: D1 is summed over every eligible completer-day.
    // Eligible days: C on 08-02 & 08-08 (no next-day return), A on 08-10
    // (returns 08-11) & 08-11 (no 08-12 return), D on 08-14 (returns 08-15).
    // 08-15 itself is ineligible (its day+1 has not happened).
    expect(report.retention.d1).toEqual({ eligible: 5, returned: 2, pct: 40 });
    // D7: only C (first-complete 08-02) is eligible; C returned 08-08.
    expect(report.retention.d7).toEqual({ eligible: 1, returned: 1, pct: 100 });

    // North star
    expect(report.north_star.users_with_2plus_days).toBe(2);

    // Acquisition
    const bySource = new Map(report.by_utm_source.map((row) => [row.source, row]));
    // A completed on 08-10 and 08-11 under tiktok: both days are
    // D1-eligible, and A returned the day after the first one only.
    expect(bySource.get("tiktok")).toMatchObject({ completes_user_days: 2, d1_eligible: 2, d1_returned: 1, d1_pct: 50 });
    expect(bySource.get("reddit")).toMatchObject({ completes_user_days: 0 });
    // none: C (08-02, 08-08) + D (08-14, 08-15). Eligible completer-days
    // are 08-02, 08-08, 08-14; only D's 08-14 has a next-day return.
    expect(bySource.get("none")).toMatchObject({ completes_user_days: 4, d1_eligible: 3, d1_returned: 1, d1_pct: 33.3 });

    // Boss source completion
    const byBoss = new Map(report.by_boss_source.map((row) => [row.boss_source, row]));
    expect(byBoss.get("custom")).toMatchObject({ arena_started: 2, arena_completed: 3, completion_rate_pct: 150 });
    expect(byBoss.get("daily")).toMatchObject({ arena_started: 1, arena_completed: 0, completion_rate_pct: 0 });
    expect(byBoss.get("challenge")).toMatchObject({ arena_started: 1, arena_completed: 2, completion_rate_pct: 200 });
    expect(byBoss.get("scenario")).toMatchObject({ arena_started: 1, arena_completed: 2, completion_rate_pct: 200 });

    // Generation mode (fallback question)
    const byMode = new Map(report.by_generation_mode.map((row) => [row.generation_mode, row]));
    expect(byMode.get("live_ai")).toMatchObject({ arena_started: 3, arena_completed: 5, completion_rate_pct: 166.7 });
    expect(byMode.get("curated_fallback")).toMatchObject({ arena_started: 0, arena_completed: 0, completion_rate_pct: null });

    // Outcomes + channels
    const byResult = new Map(report.by_result.map((row) => [row.result, row.arena_completed]));
    expect(byResult.get("defeated")).toBe(5);
    expect(byResult.get("named")).toBe(2);
    expect(byResult.get("released")).toBe(0);
    const byChannel = new Map(report.by_share_channel.map((row) => [row.channel, row.shares]));
    expect(byChannel.get("native")).toBe(1);
    expect(byChannel.get("download")).toBe(0);
  });

  it("excludes retention days whose follow-up window has not elapsed", async () => {
    const store = new FakeRedisStore();
    await seed(store);
    // As of 08-10: A's completers on 08-10 must not enter the D1 denominator
    // (their day+1 has not happened yet). C completed on 08-02 and 08-08 —
    // both are D1-eligible days — and C returned on neither 08-03 nor 08-09.
    const report = await computePmfReport(store, { days: 14, todayKey: "2026-08-10", now: new Date("2026-08-10T12:00:00.000Z") });
    expect(report.retention.d1).toEqual({ eligible: 2, returned: 0, pct: 0 });
    // D7 is only eligible for first-completes on or before 08-02; C returned
    // on 08-08, inside the X+6..X+8 window.
    expect(report.retention.d7).toEqual({ eligible: 1, returned: 1, pct: 100 });
  });
});
