import { MonsterData } from "./types";
import {
  generateMonster as mockGenerate,
  rerollMonster as mockReroll,
} from "./mockMonsters";
import { sanitizeInput } from "./safety";
import { isAllowedPortraitSrc } from "./portraits";
import { IMAGE_CLIENT_TIMEOUT_MS, MONSTER_CLIENT_TIMEOUT_MS } from "./timeouts";

export type GenerationErrorKind = "safety" | "rate_limit" | "invalid" | "failed";

export class GenerationError extends Error {
  readonly status: number;
  readonly kind: GenerationErrorKind;

  constructor(message: string, status: number, kind: GenerationErrorKind) {
    super(message);
    this.name = "GenerationError";
    this.status = status;
    this.kind = kind;
  }
}

function errorFromResponse(status: number, body: { error?: unknown } | null) {
  const message = typeof body?.error === "string" ? body.error : `API error ${status}`;
  if (status === 422) {
    return new GenerationError(
      message || "This input is outside the cartoon arena safety boundary.",
      422,
      "safety",
    );
  }
  if (status === 429) {
    return new GenerationError(
      message || "The cartoon portal is cooling down. Try again in a minute.",
      429,
      "rate_limit",
    );
  }
  if (status === 400) {
    return new GenerationError(message || "Tell us what stress monster to summon.", 400, "invalid");
  }
  return new GenerationError(message, status, "failed");
}

/** Curated fallbacks are only for transport/model failures, never for safety or invalid input. */
export function canUseCuratedFallback(error: unknown) {
  return !(error instanceof GenerationError) || error.kind === "failed";
}

async function callAPI(input: string, excludeName?: string): Promise<MonsterData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), MONSTER_CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch("/api/generate-monster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, excludeName }),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) throw errorFromResponse(res.status, data);
    if (!data || typeof data !== "object" || typeof data.name !== "string") {
      throw new GenerationError("Incomplete monster data from the cartoon portal.", 502, "failed");
    }
    return data as MonsterData;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateMonsterAI(input: string): Promise<MonsterData> {
  const safeInput = sanitizeInput(input);
  if (!safeInput || safeInput.isSensitive) {
    throw new GenerationError(
      "This input is outside the cartoon arena safety boundary.",
      422,
      "safety",
    );
  }
  try {
    return await callAPI(safeInput.cleaned);
  } catch (error) {
    if (!canUseCuratedFallback(error)) throw error;
    return mockGenerate(safeInput.redacted);
  }
}

export async function rerollMonsterAI(input: string, current: MonsterData): Promise<MonsterData> {
  const safeInput = sanitizeInput(input);
  if (!safeInput || safeInput.isSensitive) {
    throw new GenerationError(
      "This input is outside the cartoon arena safety boundary.",
      422,
      "safety",
    );
  }
  try {
    return await callAPI(safeInput.cleaned, current.name);
  } catch (error) {
    if (!canUseCuratedFallback(error)) throw error;
    return mockReroll(safeInput.redacted, current);
  }
}

export async function generateCharacterImage(description: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch("/api/generate-character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
      signal: controller.signal,
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.image || typeof data.image !== "string" || !isAllowedPortraitSrc(data.image)) {
      throw new Error("Image generation failed.");
    }

    return data.image;
  } finally {
    clearTimeout(timeout);
  }
}
