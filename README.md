# Unhappy Buster

A private, playful stress-reset app that turns an everyday frustration into a ridiculous symbolic monster, then closes the loop with a 30-second cartoon boss fight.

## Live Demo

Try it now: [fuck-your-unhappy.vercel.app](https://fuck-your-unhappy.vercel.app)

Name the bad vibe, watch it become a fictional stress monster, bonk it in a cartoon arena, check how you feel, then share a spoiler-free victory card.

## Problem

Most wellness products ask for time and seriousness exactly when a person has neither. Unhappy Buster offers a short, funny reset without pretending to be therapy or encouraging real-world harm.

## Solution

**Unhappy Buster** (FYU) gives users a fast, funny release loop. Real names and contact details are redacted before generation, unsafe inputs are stopped before AI processing, and the combat is explicitly metaphorical.

## Demo Flow

```
Name it → Meet the monster → 30-second arena → Check in and close
```

1. **Name it** — Enter a short frustration or pick a low-effort prompt
2. **Meet it** — See an instant mascot-backed reveal while a custom portrait can load in the background
3. **Release it** — Choose a silly prop and scene, then use Bonk, Smush, Roast, and Rage for up to 30 seconds
4. **Close it** — Get an honest defeated/released/named outcome, check your mood, take a small next step, and optionally share a safe card

## Core Features (MVP)

- Fast AI-assisted monster profiles with curated offline fallbacks
- Immediate reveal with generated portrait enhancement in the background
- PII redaction and sensitive-input gates on both text and image routes
- Compact 30-second mobile arena with haptics, opt-in voice, Rage Mode, combo, and reduced-motion support
- Countdown starts on the first attack, so reading the boss cue never burns play time
- Counter-based Bonk / Smush / Roast strategy, a stronger phase two, and a dedicated finishing move
- Honest closure outcomes that never label a single hit as a victory
- One-tap scenarios, a rotating curated Daily Boss, and allowlisted raw-text-free challenge links
- Local field guide, unlockable props/scenes/finishers, and privacy-friendly aggregate funnel counters
- Mood check, small next step, private local streak, and raw-text-free share cards
- Responsive layout for mobile and desktop

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Runtime | React 19 |
| AI | OpenAI API with curated local fallback content |

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
npm run test
npm run build
npm run start
```

## Environment Variables

| Variable | Required | Notes |
|----------|----------|-------|
| `OPENAI_API_KEY` | Optional | Used server-side for monster copy and custom portraits; the curated experience still works without it |
| `DISABLE_IMAGE_GENERATION` | Optional | Set to `true` to pause custom portraits without taking the app down |
| `UPSTASH_REDIS_REST_URL` | Optional | Shared rate-limit store so serverless instances share one AI budget |
| `UPSTASH_REDIS_REST_TOKEN` | Optional | Companion token for the Upstash REST gate |

## Deployment

This app is Vercel-ready.

1. Import the GitHub repo into Vercel.
2. Add `OPENAI_API_KEY` in Project Settings → Environment Variables.
3. Deploy with the default Next.js settings.
4. Run `npm run build` locally before pushing major changes.

## Safety Notes

- The app is a brief comedy reset, not therapy, crisis support, or an encouragement of real-world harm.
- The app does not persist raw vent text. Only streaks, fictional monster metadata, bounded play stats, unlock state, and allowlisted aggregate event counts are stored locally on the device.
- Names, emails, and phone-like strings are redacted before an AI request is built.
- Self-harm, violent, hateful, or sexual inputs are stopped before text or image generation and receive a supportive redirect.
- Generated portraits use structured fictional monster traits rather than the original vent text.
- API keys stay server-side and `.env.local` is ignored by git.

## Next Validation Steps

- Run opt-in user tests before claiming retention lift; the current build proves the mechanics, not their market impact
- Add abuse/cost controls suitable for high-volume AI generation
- Compare safe challenge-card formats and first-session activation copy
- If cross-device cohort analytics are needed, add an explicitly consented, payload-free analytics backend
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` before a high-volume public launch so the AI gate is shared across instances

## License

MIT
