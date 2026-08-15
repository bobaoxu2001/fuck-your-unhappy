import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GenerationError,
  canUseCuratedFallback,
  generateMonsterAI,
  rerollMonsterAI,
} from "./generateMonster";
import {
  IMAGE_CLIENT_TIMEOUT_MS,
  IMAGE_SERVER_TIMEOUT_MS,
  MONSTER_CLIENT_TIMEOUT_MS,
  MONSTER_SERVER_TIMEOUT_MS,
} from "./timeouts";
import type { MonsterData } from "./types";

const sampleMonster: MonsterData = {
  name: "Inbox Imp",
  emoji: "👿",
  archetype: "ping goblin",
  appearance: "A tiny goblin made of unread badges.",
  description: "Turns one slack into a pile.",
  personality: "Loud and redundant.",
  crime: "Multiplying pings",
  toxicSkill: "Notification fog",
  weakness: "Do not disturb",
  finalRoast: "Muted with prejudice.",
  diagnosis: "Acute badge rash",
  battleIntro: "The imp joins with 39 unread omens.",
  victoryMessage: "The thread is quiet.",
  color: "#FF6B6B",
  keywords: [],
  taunts: ["Ping!", "Quick question!", "You there?"],
  reactions: ["Urgent!", "Circling back!", "Please advise!", "For visibility!"],
  aura: "notification static",
  vibe: "corporate",
};

describe("generation timeouts", () => {
  it("keeps the browser abort longer than the server model budget", () => {
    expect(MONSTER_CLIENT_TIMEOUT_MS).toBeGreaterThan(MONSTER_SERVER_TIMEOUT_MS);
    expect(IMAGE_CLIENT_TIMEOUT_MS).toBeGreaterThan(IMAGE_SERVER_TIMEOUT_MS);
  });
});

describe("canUseCuratedFallback", () => {
  it("never treats a safety or validation error as a playable fallback", () => {
    expect(canUseCuratedFallback(new GenerationError("blocked", 422, "safety"))).toBe(false);
    expect(canUseCuratedFallback(new GenerationError("slow down", 429, "rate_limit"))).toBe(false);
    expect(canUseCuratedFallback(new GenerationError("bad input", 400, "invalid"))).toBe(false);
    expect(canUseCuratedFallback(new GenerationError("model down", 500, "failed"))).toBe(true);
    expect(canUseCuratedFallback(new Error("network"))).toBe(true);
  });
});

describe("generateMonsterAI", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("throws on a 422 and does not invent a playable boss", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "blocked", reason: "violence" }), { status: 422 }),
    ));

    await expect(generateMonsterAI("I will kill him after standup")).rejects.toMatchObject({
      name: "GenerationError",
      kind: "safety",
      status: 422,
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not fall back when the API itself returns 422", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "This input needs a safer description." }), { status: 422 }),
    ));

    await expect(generateMonsterAI("a frustrating meeting that never ends")).rejects.toBeInstanceOf(GenerationError);
    await expect(generateMonsterAI("a frustrating meeting that never ends")).rejects.toMatchObject({ kind: "safety" });
  });

  it("does not fall back on a 429 cool-down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "The cartoon portal is cooling down." }), { status: 429 }),
    ));

    await expect(generateMonsterAI("deadline panic and too many unfinished tasks")).rejects.toMatchObject({
      kind: "rate_limit",
    });
  });

  it("falls back to a curated monster when the portal is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ error: "model unavailable" }), { status: 500 }),
    ));

    const monster = await generateMonsterAI("deadline panic and too many unfinished tasks");
    expect(monster.fallback).toBe(true);
    expect(monster.name).toBeTruthy();
  });

  it("refuses to replace the current boss after a safety reroll", async () => {
    await expect(rerollMonsterAI("I want to kill myself", sampleMonster)).rejects.toMatchObject({
      kind: "safety",
    });
  });
});
