import { describe, expect, it } from "vitest";
import { HP_MAX } from "./battle";
import { buildSummary } from "./buildSummary";
import type { MonsterData } from "./types";

const monster: MonsterData = {
  name: "Calendar Clive",
  emoji: "📅",
  archetype: "agenda moth",
  appearance: "A moth in a blazer.",
  description: "Turns one ping into a meeting.",
  personality: "Polite and circular.",
  crime: "Stealing afternoons",
  toxicSkill: "Agenda camouflage",
  weakness: "A decision with an owner",
  finalRoast: "Your action items have been reassigned to the moon.",
  diagnosis: "Chronic calendar fluttering",
  battleIntro: "This should be quick.",
  victoryMessage: "Seven minutes returned to civilization.",
  color: "#8B5CF6",
  keywords: [],
  taunts: ["Let's wait.", "One thought.", "Can you see this?"],
  reactions: ["Off-agenda!", "Follow-up!", "Who owns this?", "Notes later!"],
  aura: "calendar congestion",
  vibe: "corporate",
};

describe("buildSummary outcomes", () => {
  it("never labels a zero-hit round as a victory", () => {
    const summary = buildSummary(monster, 0, 0, 0, 0, 0, HP_MAX, 0);
    expect(summary.outcome).toBe("named");
    expect(summary.releaseStatus).toBe("Pattern identified");
    expect(summary.headline).toBe("MONSTER NAMED");
    expect(summary.arenaProgress).toBe(0);
  });

  it("calls an early stop with hits a release, not a defeat", () => {
    const summary = buildSummary(monster, 4, 2, 40, 16, 0, 180, 8);
    expect(summary.outcome).toBe("released");
    expect(summary.releaseStatus).toBe("Closed on your terms");
    expect(summary.headline).toBe("YOU CALLED TIME");
  });

  it("requires the boss HP to hit zero before calling it defeated", () => {
    const summary = buildSummary(monster, 12, 5, 260, 40, 1, 0, 18);
    expect(summary.outcome).toBe("defeated");
    expect(summary.arenaProgress).toBe(100);
    expect(summary.elapsedSeconds).toBe(18);
    expect(summary.nextStep).toMatch(/notification|task/i);
  });
});
