import { describe, expect, it } from "vitest";
import { HP_MAX, RAGE_MAX } from "./battle";
import {
  applyNormalHitHp,
  attackIdToIntent,
  isCounterAttack,
  isFinisherReady,
  nextCombo,
  nextIntent,
  nextRage,
  resolveAttackDamage,
  shouldEnterPhaseTwo,
} from "./arenaEngine";

describe("arena engine", () => {
  it("maps each move to a readable counter", () => {
    expect(attackIdToIntent("slap")).toBe("wobble");
    expect(attackIdToIntent("punch")).toBe("guard");
    expect(attackIdToIntent("roast")).toBe("rant");
    expect(isCounterAttack("guard", "punch")).toBe(true);
    expect(isCounterAttack("guard", "slap")).toBe(false);
  });

  it("never repeats the current intent", () => {
    const next = nextIntent("wobble", (options) => {
      expect(options).not.toContain("wobble");
      return options[0];
    });
    expect(next).not.toBe("wobble");
  });

  it("rewards counters and punishes whiffs", () => {
    const counter = resolveAttackDamage({
      attackId: "punch",
      isCounter: true,
      bossPhase: 1,
      isRaging: false,
      remainingHp: HP_MAX,
      roll: (min) => min,
    });
    const whiff = resolveAttackDamage({
      attackId: "punch",
      isCounter: false,
      bossPhase: 1,
      isRaging: false,
      remainingHp: HP_MAX,
      roll: (min) => min,
    });
    const phaseTwo = resolveAttackDamage({
      attackId: "punch",
      isCounter: true,
      bossPhase: 2,
      isRaging: false,
      remainingHp: HP_MAX,
      roll: (min) => min,
    });

    expect(counter).toBeGreaterThan(whiff);
    expect(phaseTwo).toBeGreaterThan(counter);
  });

  it("keeps a normal hit from scoring a knockout", () => {
    expect(applyNormalHitHp(8, 8)).toEqual({ rawNextHP: 0, nextHP: 1 });
    expect(shouldEnterPhaseTwo(HP_MAX / 2, 1)).toBe(true);
    expect(shouldEnterPhaseTwo(HP_MAX / 2, 2)).toBe(false);
    expect(isFinisherReady(2, RAGE_MAX, 90)).toBe(true);
    expect(isFinisherReady(1, RAGE_MAX, 90)).toBe(false);
  });

  it("builds combo only on counters and fills rage slower on a miss", () => {
    expect(nextCombo(2, true, "slap")).toBe(4);
    expect(nextCombo(2, false, "slap")).toBe(0);
    expect(nextRage(0, 20, true, false)).toBe(25);
    expect(nextRage(0, 20, false, false)).toBe(7);
    expect(nextRage(40, 20, true, true)).toBe(40);
  });
});
