import { afterEach, describe, expect, it, vi } from "vitest";
import { checkKeyedGate, checkUpstashGate, resetRequestGates } from "./requestGate";

describe("request gate", () => {
  afterEach(() => {
    resetRequestGates();
  });

  it("allows traffic up to the limit and then cools down", () => {
    const options = { bucket: "monster", limit: 2, windowMs: 60_000 };
    const first = checkKeyedGate("ip:1", options, 1_000);
    const second = checkKeyedGate("ip:1", options, 1_100);
    const third = checkKeyedGate("ip:1", options, 1_200);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resets after the window and isolates keys", () => {
    const options = { bucket: "portrait", limit: 1, windowMs: 1_000 };
    expect(checkKeyedGate("ip:a", options, 0).allowed).toBe(true);
    expect(checkKeyedGate("ip:a", options, 10).allowed).toBe(false);
    expect(checkKeyedGate("ip:b", options, 10).allowed).toBe(true);
    expect(checkKeyedGate("ip:a", options, 1_001).allowed).toBe(true);
  });

  it("reads a shared Upstash counter when configured", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify([{ result: 3 }, { result: 1 }, { result: 45_000 }]), { status: 200 }),
    );
    const blocked = await checkUpstashGate(
      "portrait:1.1.1.1",
      { bucket: "portrait", limit: 3, windowMs: 60_000 },
      { UPSTASH_REDIS_REST_URL: "https://example-upstash.upstash.io", UPSTASH_REDIS_REST_TOKEN: "token" },
      fetchImpl as unknown as typeof fetch,
    );

    expect(blocked?.allowed).toBe(true);
    const over = await checkUpstashGate(
      "portrait:1.1.1.1",
      { bucket: "portrait", limit: 2, windowMs: 60_000 },
      { UPSTASH_REDIS_REST_URL: "https://example-upstash.upstash.io", UPSTASH_REDIS_REST_TOKEN: "token" },
      fetchImpl as unknown as typeof fetch,
    );
    expect(over?.allowed).toBe(false);
    expect(over?.retryAfterSeconds).toBe(45);
  });

  it("falls back when Upstash is not configured", async () => {
    const result = await checkUpstashGate("portrait:x", { bucket: "portrait", limit: 1, windowMs: 1000 }, {});
    expect(result).toBeNull();
  });
});
