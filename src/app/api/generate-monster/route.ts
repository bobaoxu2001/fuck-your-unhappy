import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { generateMonster, generateSafeFallbackMonster } from "@/lib/mockMonsters";
import { MonsterData } from "@/lib/types";
import { sanitizeInput, safeJsonString } from "@/lib/safety";

export const runtime = "nodejs";

const MODEL = "gpt-4o-mini";
const REQUEST_TIMEOUT_MS = 8000;

const SYSTEM_PROMPT = `You are a character generator for a stress-relief app called "Fuck Your Unhappy".
The user types what frustrated them. You create a symbolic stress monster: an exaggerated cartoon HUMAN PERSONALITY, toxic pattern, or annoying archetype. If the input appears to name a real person, do NOT target the person directly; transform the situation into a symbolic stress monster based on the behavior or pattern.

RULES:
- Tone: comedic, cartoonish, absurd, cathartic, and safe.
- Attacks in the app are metaphorical cartoon actions against stress, never real-world harm.
- Avoid hate, sexual content, self-harm, extremism, graphic violence, slurs, or humiliating protected classes.
- Name: 2-3 words, punny or alliterative.
- Archetype: 2-3 words, behavior pattern or relationship type.
- Appearance: one vivid cartoon sentence, max 16 words.
- Description: 1-2 funny sentences about their stress power move, max 30 words.
- Personality: one sentence, max 18 words.
- Weakness: 3-6 words, ironic or absurd. E.g. "Being asked for feedback", "Direct eye contact", "Receipts being produced"
- Taunts: exactly 3 short first-person lines. Max 8 words each.
- Reactions: exactly 4 short defensive phrases. Max 8 words each.
- Battle intro: one short sentence for entering the arena.
- Victory message: one short funny release message, non-graphic.
- Emoji: pick ONE from this list that best fits the personality: 🤡 😤 🥸 🫠 😈 🙄 😬 💁 👺 😎 🤓 🫡 😅 👔 🤵 🧟 👨‍💼 🙃 😏 🫥
- Color: pick ONE hex from this list: #FF6B6B #FFA94D #9775FA #FF8787 #66D9E8 #E599F7 #FFC078 #74C0FC
- Aura: 2-4 words, their oppressive energy. E.g. "toxic positivity", "weaponized incompetence", "strategic victimhood", "passive aggression", "manufactured urgency"
- Vibe: exactly one word from this list based on the context: "corporate", "family", "dating", "friendship", "school", "online", "general"

Respond with ONLY valid JSON. No markdown, no explanation, no code block:
{"name":"...","emoji":"...","archetype":"...","appearance":"...","description":"...","personality":"...","weakness":"...","battleIntro":"...","victoryMessage":"...","taunts":["...","...","..."],"reactions":["...","...","...","..."],"aura":"...","vibe":"...","color":"..."}`;

const VIBES = ["corporate", "family", "dating", "friendship", "school", "online", "general"] as const;
const COLORS = ["#FF6B6B", "#FFA94D", "#9775FA", "#FF8787", "#66D9E8", "#E599F7", "#FFC078", "#74C0FC"];

function normalizeMonster(raw: Partial<MonsterData>, fallback: MonsterData): MonsterData {
  const clean = (value: unknown, max = 120) =>
    typeof value === "string"
      ? value.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max)
      : "";
  const cleanList = (value: unknown, size: number, max = 70) =>
    Array.isArray(value) ? value.map((item) => clean(item, max)).filter(Boolean).slice(0, size) : [];
  const taunts = cleanList(raw.taunts, 3, 48);
  const reactions = cleanList(raw.reactions, 4, 58);
  const vibe = typeof raw.vibe === "string" && VIBES.includes(raw.vibe as MonsterData["vibe"])
    ? raw.vibe as MonsterData["vibe"]
    : fallback.vibe;

  return {
    ...fallback,
    name: clean(raw.name, 40) || fallback.name,
    emoji: clean(raw.emoji, 8) || fallback.emoji,
    archetype: clean(raw.archetype, 36) || fallback.archetype,
    appearance: clean(raw.appearance, 120) || fallback.appearance,
    description: clean(raw.description, 180) || fallback.description,
    personality: clean(raw.personality, 120) || fallback.personality,
    weakness: clean(raw.weakness, 50) || fallback.weakness,
    battleIntro: clean(raw.battleIntro, 140) || fallback.battleIntro,
    victoryMessage: clean(raw.victoryMessage, 140) || fallback.victoryMessage,
    taunts: taunts.length === 3 ? taunts : fallback.taunts,
    reactions: reactions.length === 4 ? reactions : fallback.reactions,
    aura: clean(raw.aura, 42) || fallback.aura,
    vibe,
    color: raw.color && COLORS.includes(raw.color) ? raw.color : fallback.color,
    keywords: [],
    fallback: false,
  };
}

function fallbackResponse(input: string, status = 200) {
  return NextResponse.json(generateMonster(input), { status });
}

function safeBoundaryResponse() {
  return NextResponse.json(generateSafeFallbackMonster());
}

export async function POST(req: NextRequest) {
  let fallbackInput = "stress";

  try {
    const body = await req.json().catch(() => null);
    const safeInput = sanitizeInput(body?.input);
    const excludeName = typeof body?.excludeName === "string" ? body.excludeName.slice(0, 80) : undefined;

    if (!safeInput) {
      return NextResponse.json({ error: "Tell us what stress monster to summon." }, { status: 400 });
    }

    fallbackInput = safeInput.cleaned;

    if (safeInput.isSensitive) {
      return safeBoundaryResponse();
    }

    if (!process.env.OPENAI_API_KEY) {
      return fallbackResponse(safeInput.cleaned);
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: REQUEST_TIMEOUT_MS,
    });
    const fallback = generateMonster(safeInput.cleaned);
    const userPrompt = excludeName
      ? `User frustration: "${safeJsonString(safeInput.symbolicTarget)}"\nAvoid the previous name: "${safeJsonString(excludeName)}". Pick a different angle or archetype.`
      : `User frustration: "${safeJsonString(safeInput.symbolicTarget)}"`;

    const response = await client.chat.completions.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.8,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const monster = normalizeMonster(JSON.parse(raw.trim()), fallback);

    if (!monster.name || !monster.emoji || !monster.description || monster.taunts.length !== 3) {
      throw new Error("Incomplete monster data from AI");
    }

    return NextResponse.json(monster);
  } catch {
    return fallbackResponse(fallbackInput);
  }
}
