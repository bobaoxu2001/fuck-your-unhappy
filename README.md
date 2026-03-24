# Fuck Your Unhappy

A stress-relief micro app that turns your daily frustrations into cartoon monsters you can smash to pieces.

## Problem

Everyone has bad days — a terrible boss, a missed deadline, an anxiety spiral. But there's no quick, fun way to process that frustration in 30 seconds on your phone.

## Solution

**Fuck Your Unhappy** gives you a chaotic, cartoonish arena to vent. Type what's bothering you, watch it become a ridiculous monster, then tap it into oblivion. It's dumb, it's loud, and it works.

## Demo Flow

```
Input → Reveal → Arena → Summary
```

1. **Vent Input** — Type who or what ruined your day
2. **Character Reveal** — A stress monster is generated based on your input, complete with a name, backstory, and weakness
3. **Vent Arena** — Tap the monster to smash it. Build combos, watch the stress bar fill, and trigger comic-style hit effects
4. **Release Summary** — See your stats: damage dealt, stress reduced, and a personalized roast line. Then start over or share your victory

## Core Features (MVP)

- Keyword-matched monster generation from a curated roster
- Re-roll to get a different monster
- Tap-to-smash arena with hit counter, combo streaks, and floating comic stickers
- Stress bar with gradient fill and critical-stress alerts
- Animated summary screen with stat cards
- Full restart loop — smash as many bosses as you want

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Runtime | React 19 |
| Design | Stitch (reference) |

## Run Locally

```bash
git clone https://github.com/your-username/fuck-your-unhappy.git
cd fuck-your-unhappy
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or in a mobile-sized browser window.

## Future Improvements

- **AI-generated monsters** — Use an LLM to create unique names, descriptions, and weaknesses from user input
- **AI-generated visuals** — Generate custom monster artwork per session
- **Share your victory** — Export summary as an image for social media
- **Sound effects** — Comic-style hit sounds and victory fanfare
- **Monster gallery** — Save and revisit past defeated monsters
- **Multiplayer mode** — Co-smash monsters with friends in real time

## License

MIT
