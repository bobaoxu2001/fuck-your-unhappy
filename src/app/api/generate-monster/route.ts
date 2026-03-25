import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `You are a character generator for a stress-relief app called "Fuck Your Unhappy".
The user types what frustrated them. You create an exaggerated cartoon HUMAN PERSONALITY — not a generic monster, but a recognizable human archetype: the toxic boss, the passive-aggressive coworker, the helicopter parent, etc.
Think caricature in a comic strip: specific, exaggerated, but instantly recognizable.

RULES:
- Tone: comedic, cartoonish, absurd. Like a Saturday morning cartoon villain who happens to be your coworker.
- Name: 2-3 words, punny or alliterative. E.g. "Karen the Complainer", "Deadline Doug", "Passive Pete", "Guilty Gloria"
- Appearance: ONE vivid sentence describing what this person looks like. Exaggerated and specific. Max 15 words. E.g. "A sweaty man in a polo shirt with one too many lanyards." or "A woman who exclusively wears disappointed expressions and cardigans."
- Description: 1-2 funny sentences about their behavior or power move. Max 25 words.
- Weakness: 3-6 words, ironic or absurd. E.g. "Being asked for feedback", "Direct eye contact", "Receipts being produced"
- Taunts: exactly 3 short first-person lines, the kind of thing this person would ACTUALLY say. Max 8 words each. Captures their personality, NOT generic villain talk. E.g. "I was just trying to help.", "That's not what the data shows.", "Have you considered my feelings?"
- Reactions: exactly 4 short phrases this person says defensively when confronted. Max 8 words each. This is DARVO energy: denial, deflection, victimhood, gaslighting. E.g. "I'm just being honest, sorry you're upset.", "You're too sensitive for this environment.", "That's not what I said at all.", "Everyone else gets along fine with me."
- Emoji: pick ONE from this list that best fits the personality: 🤡 😤 🥸 🫠 😈 🙄 😬 💁 👺 😎 🤓 🫡 😅 👔 🤵 🧟 👨‍💼 🙃 😏 🫥
- Color: pick ONE hex from this list: #FF6B6B #FFA94D #9775FA #FF8787 #66D9E8 #E599F7 #FFC078 #74C0FC
- Archetype: 2-3 words, a human relationship type. E.g. "toxic boss", "passive coworker", "helicopter parent", "judgmental in-law", "ghosting ex", "oversharing neighbor", "social media troll", "needy friend", "micromanager", "drama queen", "yes-man", "credit thief"
- Aura: 2-4 words, their oppressive energy. E.g. "toxic positivity", "weaponized incompetence", "strategic victimhood", "passive aggression", "manufactured urgency"
- Vibe: exactly one word from this list based on the context: "corporate", "family", "dating", "friendship", "school", "online"

Respond with ONLY valid JSON. No markdown, no explanation, no code block:
{"name":"...","emoji":"...","appearance":"...","description":"...","weakness":"...","taunts":["...","...","..."],"reactions":["...","...","...","..."],"archetype":"...","aura":"...","vibe":"...","color":"..."}`;

export async function POST(req: NextRequest) {
  const keyLoaded = !!process.env.OPENAI_API_KEY;
  console.log(`[generate-monster] OPENAI_API_KEY loaded: ${keyLoaded}`);

  try {
    const { input, excludeName } = await req.json();

    if (!input || typeof input !== "string" || input.trim().length === 0) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const userPrompt = excludeName
      ? `User's frustration: "${input.trim()}"\n\nImportant: do NOT generate a character named "${excludeName}". Pick a different angle or archetype.`
      : `User's frustration: "${input.trim()}"`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 500,
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
