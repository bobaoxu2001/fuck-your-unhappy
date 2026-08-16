import { describe, expect, it, vi } from "vitest";
import { buildAnalyticsEvent } from "./analyticsSchema";
import {
  ANALYTICS_KEY_PREFIX,
  buildWritePipeline,
  createUpstashStoreReader,
  eventSourceValue,
  getAnalyticsStoreEnv,
  resolveCompletionSource,
} from "./analyticsStorage";
import { FakeRedisStore, TEST_SESSION_1, TEST_UUID_A } from "./analyticsTestUtils";

const NOW = new Date("2026-08-13T15:00:00.000Z");
const DAY = "2026-08-13";

function completedEvent(overrides: Record<string, unknown> = {}) {
  return buildAnalyticsEvent({
    installId: TEST_UUID_A,
    sessionId: TEST_SESSION_1,
    event: "arena_completed",
    props: { boss_source: "custom", generation_mode: "live_ai", result: "defeated", duration_bucket: "10_to_20" },
    ...overrides,
  });
}

describe("analytics storage write pipeline", () => {
  it("builds daily counters, first-seen, comp, second-fight, and source keys", () => {
    const event = completedEvent({ acq: { source: "tiktok", medium: "organic", campaign: "boss_01" } })!;
    const plan = buildWritePipeline([event], NOW);
    const flat = JSON.stringify(plan.commands);

    expect(flat).toContain('["INCR","' + ANALYTICS_KEY_PREFIX + 'd:' + DAY + ':arena_completed"]');
    expect(flat).toContain('["INCR","' + ANALYTICS_KEY_PREFIX + 'd:' + DAY + ':arena_completed:custom"]');
    expect(flat).toContain('["INCR","' + ANALYTICS_KEY_PREFIX + 'd:' + DAY + ':arena_completed:live_ai"]');
    expect(flat).toContain('["INCR","' + ANALYTICS_KEY_PREFIX + 'd:' + DAY + ':arena_completed:defeated"]');
    expect(flat).toContain('["SADD","' + ANALYTICS_KEY_PREFIX + 'comp:' + DAY + '","' + TEST_UUID_A + '"]');
    expect(flat).toContain('["ZINCRBY","' + ANALYTICS_KEY_PREFIX + 'cs:' + DAY + '",1,"' + TEST_SESSION_1 + '"]');
    expect(flat).toContain('["HGET","' + ANALYTICS_KEY_PREFIX + 'src","' + TEST_UUID_A + '"]');
    expect(flat).toContain('["HSET","' + ANALYTICS_KEY_PREFIX + 'src","' + TEST_UUID_A + '","tiktok|organic|boss_01"]');
    expect(flat).toContain('["HSETNX","' + ANALYTICS_KEY_PREFIX + 'firstseen","' + TEST_UUID_A + '","' + DAY + '"]');
    expect(plan.completions).toHaveLength(1);
  });

  it("stores only enum labels and identifiers — no content can leak", () => {
    const event = completedEvent()!;
    const plan = buildWritePipeline([event], NOW);
    const flat = JSON.stringify(plan.commands);
    for (const forbidden of ["my boss", "vent", "email", "alice", "frustrat"]) {
      expect(flat).not.toContain(forbidden);
    }
  });

  it("does not HSET the source hash when the event has no utm", () => {
    const event = completedEvent()!;
    const plan = buildWritePipeline([event], NOW);
    expect(JSON.stringify(plan.commands)).not.toContain('["HSET","' + ANALYTICS_KEY_PREFIX + 'src"');
  });

  it("resolves completion sources from stored or event values", () => {
    const withSource = completedEvent({ acq: { source: "reddit" } })!;
    const without = completedEvent()!;
    expect(resolveCompletionSource("reddit|community|campaign_01", without)).toBe("reddit");
    expect(resolveCompletionSource(null, withSource)).toBe("reddit");
    expect(resolveCompletionSource(null, without)).toBe("none");
    expect(eventSourceValue(withSource)).toBe("reddit||");
    expect(eventSourceValue(without)).toBe("none");
  });

  it("exposes the store env only when both Upstash vars are set", () => {
    expect(getAnalyticsStoreEnv({})).toBeNull();
    expect(getAnalyticsStoreEnv({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io" })).toBeNull();
    expect(
      getAnalyticsStoreEnv({ UPSTASH_REDIS_REST_URL: "https://x.upstash.io/", UPSTASH_REDIS_REST_TOKEN: "tok" }),
    ).toEqual({ baseUrl: "https://x.upstash.io", token: "tok" });
  });

  it("maps pipeline results and treats per-command errors as null", async () => {
    const fetchImpl = vi.fn(async (_input: RequestInfo | URL) => {
      void _input;
      return new Response(JSON.stringify([{ result: 7 }, { error: "ERR nope" }]), { status: 200 });
    });
    const store = createUpstashStoreReader("https://x.upstash.io", "tok", fetchImpl as unknown as typeof fetch);
    expect(await store.pipeline([["INCR", "k"], ["GET", "k"]])).toEqual([7, null]);
    expect(String(fetchImpl.mock.calls[0][0])).toBe("https://x.upstash.io/pipeline");
  });

  it("throws on store failure so the route can fail open", async () => {
    const fetchImpl = vi.fn(async () => new Response("boom", { status: 500 }));
    const store = createUpstashStoreReader("https://x.upstash.io", "tok", fetchImpl as unknown as typeof fetch);
    await expect(store.pipeline([["GET", "k"]])).rejects.toThrow("unavailable");
  });

  it("executes the full write path against the fake store", async () => {
    const store = new FakeRedisStore();
    const event = completedEvent({ acq: { source: "tiktok" } })!;
    const plan = buildWritePipeline([event], NOW);
    const results = await store.pipeline(plan.commands);
    expect(store.getString(ANALYTICS_KEY_PREFIX + "d:" + DAY + ":arena_completed")).toBe(1);
    expect(store.getSet(ANALYTICS_KEY_PREFIX + "comp:" + DAY)).toEqual(new Set([TEST_UUID_A]));
    expect(store.getZset(ANALYTICS_KEY_PREFIX + "cs:" + DAY).get(TEST_SESSION_1)).toBe(1);
    expect(store.getHash(ANALYTICS_KEY_PREFIX + "src").get(TEST_UUID_A)).toBe("tiktok||");
    expect(results[plan.completions[0].hgetIndex]).toBeNull();
  });
});
