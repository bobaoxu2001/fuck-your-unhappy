import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a monster generator for a stress-relief app called "Fuck Your Unhappy".
The user types what frustrated them, and you create an exaggerated cartoon villain based on it.

RULES:
- Tone: comedic, cartoonish, absurd. Never realistic or dark.
- Name: 2-3 words, ideally alliterative or punny. E.g. "Karen the Complainer", "Deadline Doug"
- Description: 1-2 funny sentences about their origin or habits. Max 25 words.
- Weakness: 3-6 words, ironic or absurd. E.g. "Being ignored", "Actual planning"
- Taunts: exactly 3 short first-person lines the monster taunts the user with. Max 8 words each. Punchy and ridiculous.
- Emoji: pick ONE from this exact list that best fits the vibe: 👹 👺 👻 💀 🤡 😈 🧌 🧟 👾 🦹 🐲 🦊 🐸 🤖 🫠 🌚
- Color: pick ONE hex from this list: #FF6B6B #FFA94D #9775FA #FF8787 #66D9E8 #E599F7 #FFC078 #74C0FC
- Archetype: one word that captures their villain type. E.g. "tyrant", "ghost", "bureaucrat", "gossip", "parasite", "drama queen"
- Aura: 2-4 words describing their oppressive energy. E.g. "toxic positivity", "passive aggression", "weaponized incompetence"

Respond with ONLY valid JSON. No markdown, no explanation, no code block:
{"name":"...","emoji":"...","description":"...","weakness":"...","color":"...","taunts":["...","...","..."],"archetype":"...","aura":"..."}`;

export async function POST(req: NextRequest) {
  const keyLoaded = !!process.env.OPENAI_API_KEY;
  console.log(`[generate-monster] OPENAI_API_KEY loaded: ${keyLoaded}`);

  try {
    const { input, excludeName } = await req.json();

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const userPrompt = excludeName
      ? `User's frustration: "${input.trim()}"\n\nImportant: do NOT generate a monster named "${excludeName}". Pick a different angle.`
      : `User's frustration: "${input.trim()}"`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 350,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    const monster = JSON.parse(raw.trim());

    if (!monster.name || !monster.emoji || !monster.description) {
      throw new Error("Incomplete monster data from AI");
    }

    return NextResponse.json({ ...monster, keywords: [] });
  } catch (err) {
    console.error("Monster generation failed:", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
