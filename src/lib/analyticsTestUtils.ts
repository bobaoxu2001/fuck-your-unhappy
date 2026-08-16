import {
  ANALYTICS_RETENTION_SECONDS,
  RedisCommand,
  StoreReader,
  buildWritePipeline,
  compSrcKey,
  resolveCompletionSource,
} from "./analyticsStorage";
import { WireAnalyticsEvent } from "./analyticsSchema";

export function memoryStorage(): Storage {
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

/** Minimal in-memory Redis covering the commands the analytics layer uses. */
export class FakeRedisStore implements StoreReader {
  private strings = new Map<string, number>();
  private sets = new Map<string, Set<string>>();
  private hashes = new Map<string, Map<string, string>>();
  private zsets = new Map<string, Map<string, number>>();

  async pipeline(commands: ReadonlyArray<RedisCommand>): Promise<unknown[]> {
    return commands.map((command) => this.exec(command));
  }

  private exec(command: RedisCommand): unknown {
    const name = String(command[0]).toUpperCase();
    const args = command.slice(1).map((value) => String(value));
    switch (name) {
      case "INCR": {
        const key = args[0];
        const next = (this.strings.get(key) ?? 0) + 1;
        this.strings.set(key, next);
        return next;
      }
      case "EXPIRE":
        return 1;
      case "GET":
        return this.strings.get(args[0]) ?? null;
      case "HSETNX": {
        const hash = this.hashes.get(args[0]) ?? new Map<string, string>();
        this.hashes.set(args[0], hash);
        if (hash.has(args[1])) return 0;
        hash.set(args[1], args[2]);
        return 1;
      }
      case "HSET": {
        const hash = this.hashes.get(args[0]) ?? new Map<string, string>();
        this.hashes.set(args[0], hash);
        hash.set(args[1], args[2]);
        return 1;
      }
      case "HGET":
        return this.hashes.get(args[0])?.get(args[1]) ?? null;
      case "SADD": {
        const set = this.sets.get(args[0]) ?? new Set<string>();
        this.sets.set(args[0], set);
        let added = 0;
        for (let index = 1; index < args.length; index += 1) {
          if (!set.has(args[index])) {
            set.add(args[index]);
            added += 1;
          }
        }
        return added;
      }
      case "ZINCRBY": {
        const zset = this.zsets.get(args[0]) ?? new Map<string, number>();
        this.zsets.set(args[0], zset);
        const next = (zset.get(args[2]) ?? 0) + Number(args[1]);
        zset.set(args[2], next);
        return next;
      }
      case "SCARD":
        return this.sets.get(args[0])?.size ?? 0;
      case "SMEMBERS":
        return [...(this.sets.get(args[0]) ?? [])];
      case "SSCAN":
        return ["0", [...(this.sets.get(args[0]) ?? [])]];
      case "HSCAN": {
        const flat: string[] = [];
        for (const [field, value] of this.hashes.get(args[0]) ?? []) flat.push(field, value);
        return ["0", flat];
      }
      case "ZCOUNT": {
        const min = Number(args[1]);
        const max = args[2] === "+inf" ? Infinity : Number(args[2]);
        let count = 0;
        for (const score of (this.zsets.get(args[0]) ?? new Map<string, number>()).values()) {
          if (score >= min && score <= max) count += 1;
        }
        return count;
      }
      default:
        throw new Error("Unsupported fake Redis command: " + name);
    }
  }

  getString(key: string): number {
    return this.strings.get(key) ?? 0;
  }

  getSet(key: string): Set<string> {
    return this.sets.get(key) ?? new Set<string>();
  }

  getZset(key: string): Map<string, number> {
    return this.zsets.get(key) ?? new Map<string, number>();
  }

  getHash(key: string): Map<string, string> {
    return this.hashes.get(key) ?? new Map<string, string>();
  }
}

/** Full write path: stage-1 pipeline + per-completion compsrc SADDs. */
export async function writeAnalyticsBatch(
  store: StoreReader,
  events: readonly WireAnalyticsEvent[],
  now: Date,
): Promise<void> {
  const plan = buildWritePipeline(events, now);
  const results = await store.pipeline(plan.commands);
  const stage2: RedisCommand[] = [];
  for (const completion of plan.completions) {
    const storedSource = results[completion.hgetIndex];
    const source = resolveCompletionSource(storedSource, completion.event);
    const key = compSrcKey(completion.day, source);
    stage2.push(["SADD", key, completion.event.i]);
    stage2.push(["EXPIRE", key, ANALYTICS_RETENTION_SECONDS]);
  }
  if (stage2.length > 0) await store.pipeline(stage2);
}

export const TEST_UUID_A = "11111111-1111-4111-8111-111111111111";
export const TEST_UUID_B = "22222222-2222-4222-8222-222222222222";
export const TEST_UUID_C = "33333333-3333-4333-8333-333333333333";
export const TEST_UUID_D = "44444444-4444-4444-8444-444444444444";
export const TEST_SESSION_1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const TEST_SESSION_2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const TEST_SESSION_3 = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
