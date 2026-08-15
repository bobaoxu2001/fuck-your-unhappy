import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearLocalAnalytics,
  exportLocalAnalytics,
  readLocalAnalytics,
  trackLocalEvent,
} from "./localAnalytics";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

describe("local analytics", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: memoryStorage() },
      configurable: true,
    });
  });

  afterEach(() => {
    clearLocalAnalytics();
  });

  it("tracks allowlisted events with UTC day bounds", () => {
    const after = trackLocalEvent("app_opened", "2026-08-13T12:00:00.000Z");
    expect(after.events.app_opened).toEqual({
      count: 1,
      firstDateKey: "2026-08-13",
      lastDateKey: "2026-08-13",
    });
    const later = trackLocalEvent("app_opened", "2026-08-14T12:00:00.000Z");
    expect(later.events.app_opened?.count).toBe(2);
    expect(later.events.app_opened?.lastDateKey).toBe("2026-08-14");
    expect(later.funnel[0]).toMatchObject({ event: "app_opened", reached: true, count: 2 });
  });

  it("rejects unknown event names without persisting them", () => {
    const snapshot = trackLocalEvent("vent_leaked" as never, "2026-08-13T12:00:00.000Z");
    expect(snapshot.totalEvents).toBe(0);
    expect(snapshot.events).toEqual({});
  });

  it("drops malformed counters when reading stored state", () => {
    window.localStorage.setItem(
      "unhappy-buster-analytics-v1",
      JSON.stringify({
        schemaVersion: 1,
        events: {
          app_opened: { count: 5, firstDateKey: "not-a-date", lastDateKey: "2026-08-13" },
          unknown_event: { count: 1, firstDateKey: "2026-08-13", lastDateKey: "2026-08-13" },
        },
      }),
    );
    const snapshot = readLocalAnalytics();
    expect(snapshot.events.app_opened).toBeUndefined();
    expect(Object.keys(snapshot.events)).toEqual([]);
    expect(snapshot.totalEvents).toBe(0);
  });

  it("exports counters without identifier fields or event payloads", () => {
    trackLocalEvent("share_completed", "2026-08-13T12:00:00.000Z");
    const exported = exportLocalAnalytics();
    expect(exported).toContain("share_completed");
    expect(exported).toContain("no vent text");
    expect(exported).not.toMatch(/"(?:email|userId|ipAddress|sessionId)"|@/);
  });
});
