import { describe, expect, it } from "vitest";
import {
  buildAnalyticsEvent,
  getDurationBucket,
  normalizeUtmValue,
  validateAnalyticsEvent,
  validateEventBatch,
} from "./analyticsSchema";
import { TEST_SESSION_1, TEST_UUID_A } from "./analyticsTestUtils";

const baseEvent = () => ({
  v: 1,
  i: TEST_UUID_A,
  s: TEST_SESSION_1,
  e: "visit",
});

describe("analytics schema", () => {
  it("accepts every allowlisted event with valid enum props", () => {
    expect(validateAnalyticsEvent(baseEvent())).toMatchObject({ e: "visit" });
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "start", p: { entry_type: "organic" } })).not.toBeNull();
    expect(
      validateAnalyticsEvent({
        ...baseEvent(),
        e: "boss_revealed",
        p: { boss_source: "custom", generation_mode: "live_ai" },
      }),
    ).not.toBeNull();
    expect(
      validateAnalyticsEvent({
        ...baseEvent(),
        e: "arena_completed",
        p: { boss_source: "daily", result: "defeated", duration_bucket: "10_to_20" },
      }),
    ).not.toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "share", p: { channel: "native" } })).not.toBeNull();
  });

  it("rejects unknown events, unknown props, and non-enum values", () => {
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "vent_leaked" })).toBeNull();
    // A free-text property is the classic leak vector — it must be rejected.
    expect(validateAnalyticsEvent({ ...baseEvent(), p: { vent: "my boss is..." } })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "start", p: { entry_type: "not-a-surface" } })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "visit", p: { anything: "x" } })).toBeNull();
    expect(
      validateAnalyticsEvent({
        ...baseEvent(),
        e: "arena_completed",
        p: { boss_source: "daily", result: "defeated", duration_bucket: "10_to_20", extra: "text" },
      }),
    ).toBeNull();
  });

  it("requires the props each event needs", () => {
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "start" })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "boss_revealed" })).toBeNull();
    expect(
      validateAnalyticsEvent({ ...baseEvent(), e: "arena_completed", p: { boss_source: "daily" } }),
    ).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), e: "share" })).toBeNull();
  });

  it("rejects malformed identifiers and schema versions", () => {
    expect(validateAnalyticsEvent({ ...baseEvent(), i: "alice@example.com" })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), s: "12345" })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), v: 2 })).toBeNull();
    expect(validateAnalyticsEvent(null)).toBeNull();
    expect(validateAnalyticsEvent([])).toBeNull();
  });

  it("rejects utm values that are not already normalized", () => {
    expect(validateAnalyticsEvent({ ...baseEvent(), us: "TikTok" })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), us: "tiktok@evil.com" })).toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), us: "tiktok" })).not.toBeNull();
    expect(validateAnalyticsEvent({ ...baseEvent(), uc: "boss_of_the_day_01" })).not.toBeNull();
  });

  it("normalizes utm values for client-side capture", () => {
    expect(normalizeUtmValue(" TikTok ")).toBe("tiktok");
    expect(normalizeUtmValue("Slack_DM!")).toBe("slack_dm");
    expect(normalizeUtmValue("BOSS_OF_THE_DAY_01")).toBe("boss_of_the_day_01");
    expect(normalizeUtmValue("???")).toBeNull();
    expect(normalizeUtmValue("")).toBeNull();
    expect(normalizeUtmValue(42)).toBeNull();
    expect(normalizeUtmValue("a".repeat(100))).toHaveLength(48);
  });

  it("buckets arena durations", () => {
    expect(getDurationBucket(0)).toBe("under_10");
    expect(getDurationBucket(9.9)).toBe("under_10");
    expect(getDurationBucket(10)).toBe("10_to_20");
    expect(getDurationBucket(19.9)).toBe("10_to_20");
    expect(getDurationBucket(20)).toBe("20_to_30");
    expect(getDurationBucket(29.9)).toBe("20_to_30");
    expect(getDurationBucket(30)).toBe("over_30");
    expect(getDurationBucket(-5)).toBe("under_10");
  });

  it("builds events with normalized acquisition", () => {
    const built = buildAnalyticsEvent({
      installId: TEST_UUID_A,
      sessionId: TEST_SESSION_1,
      event: "visit",
      acq: { source: " TikTok ", medium: "Organic!", campaign: "Boss_01" },
    });
    expect(built).toMatchObject({ e: "visit", us: "tiktok", um: "organic", uc: "boss_01" });
    expect(buildAnalyticsEvent({ installId: "bad", sessionId: TEST_SESSION_1, event: "visit" })).toBeNull();
    expect(
      buildAnalyticsEvent({ installId: TEST_UUID_A, sessionId: TEST_SESSION_1, event: "start", props: { entry_type: "wrong" } }),
    ).toBeNull();
  });

  it("validates batches all-or-nothing", () => {
    expect(validateEventBatch({ events: [baseEvent()] })).toHaveLength(1);
    expect(validateEventBatch({ events: [] })).toBeNull();
    expect(validateEventBatch({ events: Array.from({ length: 51 }, () => baseEvent()) })).toBeNull();
    expect(validateEventBatch({ events: [baseEvent(), { ...baseEvent(), e: "nope" }] })).toBeNull();
    expect(validateEventBatch("not-an-object")).toBeNull();
  });
});
