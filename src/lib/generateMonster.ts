import { MonsterData } from "./types";
import {
  generateMonster as mockGenerate,
  generateSafeFallbackMonster,
  rerollMonster as mockReroll,
} from "./mockMonsters";
import { sanitizeInput } from "./safety";

const CLIENT_TIMEOUT_MS = 9000;
const IMAGE_TIMEOUT_MS = 60000;

async function callAPI(input: string, excludeName?: string): Promise<MonsterData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

  try {
    const res = await fetch("/api/generate-monster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, excludeName }),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateMonsterAI(input: string): Promise<MonsterData> {
  try {
    return await callAPI(input);
  } catch {
    if (sanitizeInput(input)?.isSensitive) return generateSafeFallbackMonster();
    return mockGenerate(input);
  }
}

export async function rerollMonsterAI(input: string, current: MonsterData): Promise<MonsterData> {
  try {
    return await callAPI(input, current.name);
  } catch {
    if (sanitizeInput(input)?.isSensitive) return generateSafeFallbackMonster();
    return mockReroll(input, current);
  }
}

export async function generateCharacterImage(description: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

  try {
    const res = await fetch("/api/generate-character", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
      signal: controller.signal,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.image || typeof data.image !== "string") {
      throw new Error("Image generation failed.");
    }

    return data.image;
  } finally {
    clearTimeout(timeout);
  }
}
