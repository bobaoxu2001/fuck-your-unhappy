import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { clearLocalProgress, readLocalProgress, recordLocalRelease } from "./localProgress";

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

describe("local progress", () => {
  beforeEach(() => {
    const storage = memoryStorage();
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: storage },
      configurable: true,
    });
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
    });
  });

  afterEach(() => {
    clearLocalProgress();
  });

  it("starts a streak on the first release and keeps it on the same day", () => {
    const first = recordLocalRelease("defeated");
    expect(first).toMatchObject({ totalReleases: 1, streakDays: 1 });
    const again = recordLocalRelease("released");
    expect(again.totalReleases).toBe(2);
    expect(again.streakDays).toBe(1);
  });

  it("continues a streak on consecutive days and resets after a gap", () => {
    const today = new Date(2026, 7, 15, 12); // local 2026-08-15
    const yesterday = new Date(2026, 7, 14, 12);
    const longAgo = new Date(2026, 7, 1, 12);

    recordLocalRelease("named", yesterday);
    const continued = recordLocalRelease("defeated", today);
    expect(continued.streakDays).toBe(2);

    const reset = recordLocalRelease("released", longAgo);
    expect(reset.streakDays).toBe(1);
  });

  it("recovers from corrupt stored state", () => {
    window.localStorage.setItem("unhappy-buster-progress-v1", "{not json");
    expect(readLocalProgress()).toEqual({ totalReleases: 0, streakDays: 0 });
  });

  it("clears stored progress", () => {
    recordLocalRelease("defeated");
    clearLocalProgress();
    expect(window.localStorage.getItem("unhappy-buster-progress-v1")).toBeNull();
    expect(readLocalProgress().totalReleases).toBe(0);
  });
});
