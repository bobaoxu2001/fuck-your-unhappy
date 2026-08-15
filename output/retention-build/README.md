# Retention build verification

Final mobile production screenshots were captured at 390 × 844.

1. `01-home.jpg` — one-tap scenarios, rotating public daily boss, and private collection entry.
2. `02-reveal.jpg` — compact reveal with playable weakness and collapsed dossier.
3. `03-strategy-phase.jpg` — phase-two strategy cue and unlocked finisher.
4. `04-finisher.jpg` — completed finisher and stable victory overlay.
5. `05-summary.jpg` — compact summary, new unlocks, mood check, safe challenge, and replay actions in one viewport.

Verified behavior:

- Countdown remains at 30 until the first attack.
- Boss intent changes after each attack and explicitly maps to Bonk, Smush, or Roast counters.
- Phase two appears below 50% HP and unlocks a dedicated finishing move once charge and HP conditions are met.
- A curated daily boss can be opened without entering any vent.
- `?challenge=<allowlisted-boss-id>` opens only a curated public boss; arbitrary text cannot be transported in the challenge.
- Challenge links may include only a bounded 1–300 second benchmark, never raw vent text or identities.
- Collection records only fictional monster labels, vibe, outcome, UTC day, combo, and bounded clear time.
- Analytics stores only allowlisted local aggregate counters and UTC date keys, with no event payloads or identifiers.
- Unlocks control props, scenes, and finishing labels.
- The field guide now exposes recent fictional discoveries, type/vibe chips, unlock progress, a readable local funnel, and two-step device-data clearing.
- Runtime edge checks reject invalid dates, non-web challenge protocols, invalid benchmarks, and unknown analytics event names.
- Input and AI output paths redact contact-like, relationship-qualified, and common CJK/Latin name patterns before portraits or share cards.
- Final lint, TypeScript, production build, and whitespace checks passed.

Evidence limits: local browser testing does not establish real-world retention lift, cross-device sync, production load capacity, or analytics cohort performance. The included per-instance AI request gate is a best-effort safety net; a high-volume public launch still needs durable infrastructure-level throttling and cost controls.
