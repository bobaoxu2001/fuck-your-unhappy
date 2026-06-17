# AGENTS.md

## Cursor Cloud specific instructions

This is a single Next.js 16 (App Router) / React 19 / TypeScript app — "Fuck Your Unhappy", a stress-relief web app. There is no database, no backend service, and no containers; the one Next.js dev server serves both the UI and the API routes (`/api/generate-monster`, `/api/generate-character`).

### Running / developing
- Dev server: `npm run dev` (Turbopack, http://localhost:3000). This is the entire stack.
- Standard scripts are in `package.json`: `dev`, `build`, `start`, `lint`.
- Node 20+ works (VM has Node 22).

### Environment variables
- `OPENAI_API_KEY` is the only env var (`.env.local`, copied from `.env.example`). It is **optional**: without it, monster text generation falls back to a curated roster in `src/lib/mockMonsters.ts`, so the core loop (vent → reveal → arena → summary) works fully.
- The `/character-generator` page and its `/api/generate-character` image route **require** `OPENAI_API_KEY` and return HTTP 500 without it. This is the only feature that hard-depends on the key.

### API note
- `POST /api/generate-monster` expects JSON field `input` (not `text`); missing/empty `input` returns HTTP 400.

### Gotchas
- `.claude/start-dev.sh` is hardcoded to a macOS path and a specific nvm node binary — do **not** use it on this Linux VM; run `npm run dev` directly.
- Framer Motion `spring`/`inertia` transitions only support **two** keyframes. Animating a 3+ keyframe array (e.g. `scale: [0, 1.3, 1]`) under a spring throws a runtime error and crashes the screen. Use a tween (`duration`) for multi-keyframe arrays, or animate to a single target and let the spring overshoot.
