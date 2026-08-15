import { HP_MAX } from "./battle";
import { MonsterData, ReleaseOutcome, ReleaseSummaryData } from "./types";

const DEFEAT_HEADLINES = [
  "BOSS CLEARED",
  "BAD VIBE BONKED",
  "PATTERN DEFLATED",
  "NEMESIS NEUTRALIZED",
];

const RELEASE_STATUSES = [
  "Returned to sender",
  "Filed under not today",
  "Converted into perspective",
  "Denied more screen time",
];

const NEXT_STEPS: Record<MonsterData["vibe"], string> = {
  corporate: "Mute one notification and choose the next five-minute task.",
  family: "Take one quiet minute before the next conversation.",
  dating: "Put the phone down and do one thing that belongs only to you.",
  friendship: "Save the reply for later; clarity does not need to be instant.",
  school: "Pick the smallest unfinished step and ignore the rest for five minutes.",
  online: "Close one tab and let the internet survive without you for a minute.",
  general: "Take one slow breath, unclench your shoulders, and choose one small next step.",
};

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function outcomeFor(hitCount: number, remainingHP: number): ReleaseOutcome {
  if (remainingHP <= 0) return "defeated";
  if (hitCount > 0) return "released";
  return "named";
}

export function buildSummary(
  monster: MonsterData,
  hitCount: number,
  bestCombo: number,
  totalDamage = 0,
  maxSingleHit = 0,
  rageActivations = 0,
  remainingHP = HP_MAX,
  elapsedSeconds = 0,
): ReleaseSummaryData {
  const outcome = outcomeFor(hitCount, remainingHP);
  const arenaProgress = Math.max(
    0,
    Math.min(100, Math.round(((HP_MAX - remainingHP) / HP_MAX) * 100)),
  );
  const bestHit = maxSingleHit > 0
    ? `${maxSingleHit}-point ego bonk`
    : "Naming the pattern";

  const headline = outcome === "defeated"
    ? pickRandom(DEFEAT_HEADLINES)
    : outcome === "released"
      ? "YOU CALLED TIME"
      : "MONSTER NAMED";
  const roastLine = outcome === "defeated"
    ? monster.finalRoast || monster.victoryMessage
    : outcome === "released"
      ? `You stopped when you were ready. ${monster.name} does not get another minute.`
      : `You named ${monster.name}. Turning a foggy feeling into a ridiculous character is already a shift.`;
  const closureLine = outcome === "defeated"
    ? `You turned ${monster.archetype} into a fictional boss and finished the round.`
    : `You turned ${monster.archetype} into a fictional boss and chose when the round ended.`;

  return {
    outcome,
    monsterName: monster.name,
    monsterArchetype: monster.archetype,
    monsterEmoji: monster.emoji,
    monsterImage: monster.image,
    hitCount,
    bestCombo,
    arenaProgress,
    headline,
    roastLine,
    closureLine,
    nextStep: NEXT_STEPS[monster.vibe],
    releaseStatus: outcome === "defeated"
      ? pickRandom(RELEASE_STATUSES)
      : outcome === "released"
        ? "Closed on your terms"
        : "Pattern identified",
    totalDamage,
    maxSingleHit,
    rageActivations,
    elapsedSeconds: Math.max(0, Math.min(300, Math.round(elapsedSeconds))),
    victoryMessage: monster.victoryMessage,
    bestHit,
    finalRoast: monster.finalRoast,
  };
}
