import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  captureAcquisitionFromUrl,
  flushAnalyticsEvent,
  getInstallId,
  getSessionId,
  isRemoteAnalyticsEnabled,
  newRandomId,
  resetRemoteIdentity,
  trackRemoteEvent,
} from "./remoteAnalytics";
import { memoryStorage } from "./analyticsTestUtils";

const ORIGINAL_FLAG = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;

function captureFetches() {
  const payloads: Array<{ events: unknown[] }> = [];
  const fetchImpl = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    payloads.push(JSON.parse(String(init?.body)));
    return new Response(null, { status: 204 });
  });
  return { fetchImpl, payloads };
}

describe("remote analytics client", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = ORIGINAL_FLAG;
    vi.restoreAllMocks();
  });

  it("is disabled unless the production flag is set", () => {
    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "false";
    expect(isRemoteAnalyticsEnabled()).toBe(false);
    const { fetchImpl, payloads } = captureFetches();
    const local = memoryStorage();
    const session = memoryStorage();
    trackRemoteEvent({ event: "visit" }, { local, session, fetchImpl });
    expect(payloads).toHaveLength(0);
    expect(local.length).toBe(0);
  });

  it("creates random UUID install/session ids that are stable and non-PII", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const install = getInstallId(local);
    const sessionId = getSessionId(session);
    expect(install).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(sessionId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(getInstallId(local)).toBe(install);
    expect(getSessionId(session)).toBe(sessionId);
    expect(install).not.toContain("@");
    const other = memoryStorage();
    expect(getInstallId(other)).not.toBe(install);
  });

  it("newRandomId always returns a valid UUID", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(newRandomId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    }
  });

  it("fires visit only once per session and once per new session", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const { fetchImpl, payloads } = captureFetches();

    trackRemoteEvent({ event: "visit" }, { local, session, fetchImpl });
    trackRemoteEvent({ event: "visit" }, { local, session, fetchImpl });
    expect(payloads).toHaveLength(1);

    const secondTab = memoryStorage();
    trackRemoteEvent({ event: "visit" }, { local, session: secondTab, fetchImpl });
    expect(payloads).toHaveLength(2);
    expect(payloads[0].events[0]).toMatchObject({ e: "visit" });
  });

  it("fires start only once per session", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const { fetchImpl, payloads } = captureFetches();
    trackRemoteEvent({ event: "start", entryType: "organic" }, { local, session, fetchImpl });
    trackRemoteEvent({ event: "start", entryType: "daily" }, { local, session, fetchImpl });
    expect(payloads).toHaveLength(1);
    expect(payloads[0].events[0]).toMatchObject({ e: "start", p: { entry_type: "organic" } });
  });

  it("payloads contain only enum labels and normalized ids — never free text", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const { fetchImpl, payloads } = captureFetches();
    trackRemoteEvent({ event: "visit" }, { local, session, fetchImpl, search: "?utm_source=TikTok&utm_medium=Organic!" });
    trackRemoteEvent(
      { event: "arena_completed", bossSource: "custom", generationMode: "live_ai", result: "defeated", durationBucket: "10_to_20" },
      { local, session, fetchImpl },
    );
    const wire = JSON.stringify(payloads);
    expect(wire).toContain('"us":"tiktok"');
    expect(wire).toContain('"um":"organic"');
    expect(wire).not.toContain("TikTok");
    expect(wire).not.toContain("my boss");
    expect(wire).not.toContain("@");
    expect(payloads[1].events[0]).toMatchObject({
      e: "arena_completed",
      p: { boss_source: "custom", generation_mode: "live_ai", result: "defeated", duration_bucket: "10_to_20" },
    });
  });

  it("keeps last-known acquisition across sessions without utm params", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const { fetchImpl, payloads } = captureFetches();
    trackRemoteEvent({ event: "visit" }, { local, session, fetchImpl, search: "?utm_source=reddit&utm_campaign=boss_of_the_day_01" });
    trackRemoteEvent({ event: "start", entryType: "daily" }, { local, session, fetchImpl, search: "" });
    expect(payloads[1].events[0]).toMatchObject({ us: "reddit", uc: "boss_of_the_day_01" });
    expect(captureAcquisitionFromUrl("", local)).toEqual({ source: "reddit", campaign: "boss_of_the_day_01" });
  });

  it("fails open: a throwing fetch never breaks gameplay", async () => {
    const failingFetch = vi.fn(async () => {
      throw new Error("network down");
    });
    expect(() =>
      trackRemoteEvent({ event: "visit" }, { local: memoryStorage(), session: memoryStorage(), fetchImpl: failingFetch }),
    ).not.toThrow();
    await expect(
      flushAnalyticsEvent({ v: 1, i: "11111111-1111-4111-8111-111111111111", s: "22222222-2222-4222-8222-222222222222", e: "visit" }, failingFetch),
    ).resolves.toBeUndefined();
  });

  it("resetting the identity mints a fresh install id", () => {
    const local = memoryStorage();
    const session = memoryStorage();
    const first = getInstallId(local);
    expect(first).toBeTruthy();
    resetRemoteIdentity(local, session);
    const second = getInstallId(local);
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
    expect(local.getItem("unhappy-buster-acq-v1")).toBeNull();
  });
});
