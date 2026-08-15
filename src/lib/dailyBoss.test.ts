import { describe, expect, it } from "vitest";
import {
  buildSafeChallengeUrl,
  getDailyBoss,
  getDailyBossById,
  getDailyBossForDay,
  getNextDailyBoss,
  readSafeChallenge,
  readSafeChallengeBenchmark,
} from "./dailyBoss";

describe("daily boss rotation", () => {
  it("returns a stable boss for a UTC day", () => {
    const first = getDailyBossForDay("2026-08-13");
    const again = getDailyBossForDay("2026-08-13");
    expect(first.id).toBe(again.id);
    expect(first.monster.fallback).toBe(true);
  });

  it("looks up allowlisted bosses only", () => {
    expect(getDailyBossById("monday-meeting-moth")?.monster.name).toBe("Monday Meeting Moth");
    expect(getDailyBossById("not-a-real-boss")).toBeNull();
  });

  it("teases a different public boss for tomorrow", () => {
    const today = new Date("2026-08-13T12:00:00.000Z");
    expect(getNextDailyBoss(today).id).not.toBe(getDailyBoss(today).id);
  });
});

describe("safe challenge links", () => {
  it("builds http(s) challenge URLs with a bounded time only", () => {
    const url = buildSafeChallengeUrl("https://fuck-your-unhappy.vercel.app/secret#leak", "reply-all-hydra", 42);
    expect(url).toBe("https://fuck-your-unhappy.vercel.app/?challenge=reply-all-hydra&time=42");
    expect(buildSafeChallengeUrl("https://example.com", "unknown-boss", 12)).toBeNull();
    expect(buildSafeChallengeUrl("javascript:alert(1)", "reply-all-hydra", 12)).toBeNull();
  });

  it("rejects raw text and invalid benchmarks in the query string", () => {
    expect(readSafeChallenge("?challenge=inbox-from-user-vent")).toBeNull();
    expect(readSafeChallenge("?challenge=buffering-basilisk")?.id).toBe("buffering-basilisk");
    expect(readSafeChallengeBenchmark("?challenge=buffering-basilisk&time=15")).toBe(15);
    expect(readSafeChallengeBenchmark("?challenge=buffering-basilisk&time=0")).toBeNull();
    expect(readSafeChallengeBenchmark("?challenge=buffering-basilisk&time=301")).toBeNull();
    expect(readSafeChallengeBenchmark("?challenge=buffering-basilisk&time=abc")).toBeNull();
    expect(readSafeChallengeBenchmark("?time=15")).toBeNull();
  });
});
