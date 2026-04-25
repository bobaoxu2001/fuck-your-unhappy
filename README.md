# Fuck Your Unhappy

A playful stress-relief web app that turns daily frustrations into ridiculous cartoon enemies, then lets users release the bad vibe in a safe, funny boss fight.

## Live Demo

Try it now: [fuck-your-unhappy.vercel.app](https://fuck-your-unhappy.vercel.app)

Type what is stressing you out, watch it become a symbolic stress monster, roast/slap/punch it in a cartoon battle arena, then share the victory stats.

## Problem

Everyone has bad days — a terrible boss, a missed deadline, an anxiety spiral. But there's no quick, fun way to process that frustration in 30 seconds on your phone.

## Solution

**Fuck Your Unhappy** gives users a fast, funny, cartoonish release loop. It is designed as stress-relief comedy, not real-world harm: real people are transformed into symbolic “stress monsters,” and attacks are metaphorical arcade actions.

## Demo Flow

```
Input → Reveal → Arena → Summary
```

1. **Vent Input** — Type what made you unhappy
2. **Character Reveal** — Generate a funny enemy with a name, archetype, appearance, weakness, taunts, intro, and victory line
3. **Battle Arena** — Use Slap, Punch, Roast, and Rage Mode with HP, combo, damage, and reaction animations
4. **Release Summary** — Review total damage, turns, best hit, best combo, rage activations, and share/restart

## Core Features (MVP)

- AI-generated monster profiles through a secure server route
- Curated fallback monster roster when AI is unavailable
- Safe symbolic fallback for sensitive inputs
- Cartoon battle arena with HP, Rage Mode, combo, taunts, damage popups, and victory overlay
- Shareable summary with stats and restart loop
- Responsive layout for mobile and desktop

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Runtime | React 19 |
| AI | OpenAI API with local fallback content |

## Run Locally

```bash
git clone https://github.com/bobaoxu2001/fuck-your-unhappy.git
cd fuck-your-unhappy
npm install
cp .env.example .env.local
npm run dev
```

Add your OpenAI key to `.env.local`:

```bash
OPENAI_API_KEY=sk-your-key-here
```

Open [http://localhost:3000](http://localhost:3000). The app still works without an API key by using curated fallback monsters.

## Scripts

```bash
npm run dev
npm run lint
npm run build
npm run start
```

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Optional for local fallback, recommended for production | Used only in the server-side `/api/generate-monster` route |

## Deployment

This app is Vercel-ready.

1. Import the GitHub repo into Vercel.
2. Add `OPENAI_API_KEY` in Project Settings → Environment Variables.
3. Deploy with the default Next.js settings.
4. Run `npm run build` locally before pushing major changes.

## Safety Notes

- The app is comedy stress relief, not an encouragement of real-world harm.
- Inputs that look like real people are transformed into symbolic stress patterns.
- Sensitive or unsafe inputs use a gentle fallback monster instead of targeted content.
- API keys stay server-side and `.env.local` is ignored by git.

## Future Improvements

- **AI-generated visuals** — Generate custom monster artwork per session
- **Sound effects** — Comic-style hit sounds and victory fanfare
- **Monster gallery** — Save and revisit past defeated monsters
- **Multiplayer mode** — Co-smash monsters with friends in real time

## License

MIT
