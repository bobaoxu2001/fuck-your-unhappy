import { MonsterData } from "./types";
import { generateMonster as mockGenerate, rerollMonster as mockReroll } from "./mockMonsters";

async function callAPI(input: string, excludeName?: string): Promise<MonsterData> {
  const res = await fetch("/api/generate-monster", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input, excludeName }),
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function generateMonsterAI(input: string): Promise<MonsterData> {
  try {
    return await callAPI(input);
  } catch {
    console.warn("AI generation failed, falling back to mock");
    return mockGenerate(input);
  }
}

export async function rerollMonsterAI(input: string, current: MonsterData): Promise<MonsterData> {
  try {
    return await callAPI(input, current.name);
  } catch {
    console.warn("AI reroll failed, falling back to mock");
    return mockReroll(input, current);
  }
}
