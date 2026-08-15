import { ATTACKS, AttackId, HP_MAX, RAGE_MAX } from "./battle";

export type BossIntent = "wobble" | "guard" | "rant";
export type BossPhase = 1 | 2;

export const INTENTS: Record<BossIntent, { label: string; cue: string; counter: AttackId; color: string }> = {
  wobble: { label: "OFF BALANCE", cue: "Bonk builds a clean combo", counter: "slap", color: "#FF6B6B" },
  guard: { label: "EGO SHIELD", cue: "Smush breaks the guard", counter: "punch", color: "#7C3AED" },
  rant: { label: "STARTING A RANT", cue: "Roast cuts it short", counter: "roast", color: "#B7791F" },
};

export const FINISHER_HP_THRESHOLD = 90;
export const COUNTER_MULTIPLIER = 1.5;
export const PHASE_TWO_COUNTER_MULTIPLIER = 1.85;
export const WHIFF_MULTIPLIER = 0.52;
export const RAGE_DAMAGE_MULTIPLIER = 2;
export const COUNTER_RAGE_MULTIPLIER = 1.25;
export const WHIFF_RAGE_MULTIPLIER = 0.35;

export function attackIdToIntent(attackId: AttackId): BossIntent {
  if (attackId === "punch") return "guard";
  if (attackId === "roast") return "rant";
  return "wobble";
}

export function isCounterAttack(intent: BossIntent, attackId: AttackId) {
  return intent === attackIdToIntent(attackId);
}

export function nextIntent(
  current: BossIntent,
  pick: (options: BossIntent[]) => BossIntent,
): BossIntent {
  const options = (Object.keys(INTENTS) as BossIntent[]).filter((intent) => intent !== current);
  return pick(options);
}

export function resolveAttackDamage(input: {
  attackId: AttackId;
  isCounter: boolean;
  bossPhase: BossPhase;
  isRaging: boolean;
  remainingHp: number;
  roll: (min: number, max: number) => number;
}) {
  const attack = ATTACKS.find((candidate) => candidate.id === input.attackId);
  if (!attack) return 0;
  const base = input.roll(attack.minDmg, attack.maxDmg);
  const strategy = input.isCounter
    ? (input.bossPhase === 2 ? PHASE_TWO_COUNTER_MULTIPLIER : COUNTER_MULTIPLIER)
    : WHIFF_MULTIPLIER;
  const damage = Math.max(1, Math.round(base * strategy * (input.isRaging ? RAGE_DAMAGE_MULTIPLIER : 1)));
  return Math.min(damage, input.remainingHp);
}

export function nextCombo(current: number, isCounter: boolean, attackId: AttackId) {
  if (!isCounter) return 0;
  return current + (attackId === "slap" ? 2 : 1);
}

export function nextRage(current: number, rageFill: number, isCounter: boolean, isRaging: boolean) {
  if (isRaging) return current;
  return Math.min(
    RAGE_MAX,
    current + Math.round(rageFill * (isCounter ? COUNTER_RAGE_MULTIPLIER : WHIFF_RAGE_MULTIPLIER)),
  );
}

/** Normal hits can only bring the boss to 1 HP. The finisher closes the round. */
export function applyNormalHitHp(current: number, damage: number) {
  const rawNextHP = Math.max(0, current - damage);
  return {
    rawNextHP,
    nextHP: rawNextHP === 0 ? 1 : rawNextHP,
  };
}

export function shouldEnterPhaseTwo(hp: number, phase: BossPhase, maxHp = HP_MAX) {
  return hp > 0 && hp <= maxHp / 2 && phase === 1;
}

export function isFinisherReady(bossPhase: BossPhase, rage: number, hp: number) {
  return bossPhase === 2 && rage >= RAGE_MAX && hp <= FINISHER_HP_THRESHOLD;
}
