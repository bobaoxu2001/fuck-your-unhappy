# Release candidate verification (2026-08-16)

Captured headlessly (Chrome, Playwright) against the production build at 390 × 844 mobile and 1280 × 800 desktop.

1. `A1-landing-mobile.png` — mobile landing: headline, public boss card, one-tap scenarios, field guide entry. No horizontal overflow.
2. `A2-landing-desktop.png` — desktop landing with mascot panel.
3. `D-reveal.png` — boss reveal reached from a one-tap scenario (curated fallback boss shown because the configured OpenAI key has no credits).
4. `E-arena.png` — arena after three attacks; HP 260 → 216, counter/combo mechanic verified separately (4/4 cues registered correct counters and damage multipliers).
5. `F-summary-early-stop.png` — early stop with zero hits produces the honest non-victory "MONSTER NAMED" outcome.
6. `G-daily-boss-reveal.png` — public daily boss card + reveal with no typing.
7. `H-challenge.png` — allowlisted `?challenge=monday-meeting-moth` renders the dare card.
8. `K-privacy.png` — privacy page.
9. `L-reduced-motion-arena.png` — arena under `prefers-reduced-motion`.

Verified behaviors:

- PII inputs (name + email) trigger the client-side identifying-details warning before generation.
- Self-harm input is blocked with the 988 support card and a disabled submit button.
- Curated offline fallback completes the loop when the generation API is unreachable.
- Corrupted localStorage payloads are dropped and the app recovers.
- Challenge URLs accept only allowlisted boss ids (arbitrary text cannot be transported).
- No horizontal overflow at 390 / 430 / 768 / 1280; arena and summary fit the mobile viewport.
- Attack buttons, intent chips, and header links pass contrast/tap-target checks after the RC pass.

Evidence limits: headless Chrome, one device locale; no real-user cohorts. The configured OpenAI key returned 429 credit_balance_exhausted during this run, so AI text/portraits were not exercised end-to-end here; the fallback path (which ran) is the production behavior for that condition.
