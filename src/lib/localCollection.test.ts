import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  clearCollection,
  getNewUnlocks,
  getNextUnlock,
  readCollection,
  recordEncounter,
  remainingForUnlock,
} from "./localCollection";

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

describe("local collection", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: memoryStorage() },
      configurable: true,
    });
  });

  afterEach(() => {
    clearCollection();
  });

  it("stores fictional labels only and unlocks after a finished round", () => {
    const before = readCollection();
    const after = recordEncounter({
      monster: { name: "Memo Menace", archetype: "complaint goblin", vibe: "corporate" },
      outcome: "defeated",
      date: "2026-08-13T12:00:00.000Z",
      bestCombo: 4,
      bestTimeMs: 18_000,
    });

    expect(after.encounters).toHaveLength(1);
    expect(after.encounters[0]).toMatchObject({
      name: "Memo Menace",
      archetype: "complaint goblin",
      vibe: "corporate",
      outcome: "defeated",
      dateKey: "2026-08-13",
      bestCombo: 4,
    });
    expect(JSON.stringify(after.encounters)).not.toMatch(/my boss|@|vent/i);
    expect(after.stats.defeated).toBe(1);

    const earned = getNewUnlocks(before, after).map(({ id }) => id);
    expect(earned).toEqual(expect.arrayContaining(["hammer", "chicken", "cooked"]));
    const next = getNextUnlock(after);
    expect(next?.id).toBe("home");
    expect(remainingForUnlock(next!)).toBe(1);
  });

  it("rejects malformed stored payloads", () => {
    window.localStorage.setItem("unhappy-buster-collection-v1", "{\"schemaVersion\":1,\"encounters\":[{\"name\":\"x\"}]}");
    expect(readCollection().encounters).toEqual([]);
  });
});
