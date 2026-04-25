export const HP_MAX = 260;
export const RAGE_MAX = 100;
export const RAGE_DURATION = 5000;
export const COMBO_TIMEOUT = 1000;
export const FLOAT_DURATION = 700;
export const ATTACK_COOLDOWN = 140;

export const ATTACKS = [
  {
    id: "slap",
    label: "Slap",
    emoji: "👋",
    detail: "quick + silly",
    minDmg: 12,
    maxDmg: 18,
    rageFill: 18,
    color: "#FF6B6B",
    floatColor: "#FF6B6B",
    texts: ["SMACK!", "WHAP!", "THWACK!", "SLIPPER!", "CHANCLA!", "SLAP!"],
    extraTexts: ["ow.", "hey!", "rude.", "again!", "ok ok", "!!!!"],
    comboText: "SLAP STORM!",
    squashDuration: 120,
  },
  {
    id: "punch",
    label: "Punch",
    emoji: "👊",
    detail: "steady damage",
    minDmg: 20,
    maxDmg: 28,
    rageFill: 24,
    color: "#7C3AED",
    floatColor: "#7C3AED",
    texts: ["BONK!", "POW!!", "SMUSH!!", "BOOP!!", "K.O.!"],
    extraTexts: [],
    comboText: "MEGA BONK!",
    squashDuration: 200,
  },
  {
    id: "roast",
    label: "Roast",
    emoji: "🎤",
    detail: "wild roll",
    minDmg: 8,
    maxDmg: 38,
    rageFill: 30,
    color: "#FFD600",
    floatColor: "#9333EA",
    texts: ["THERAPY BILL!", "PSYCHIC DAMAGE!", "CRINGE OVERLOAD!", "RECEIPTS SUBMITTED!", "WORD NUKE!"],
    extraTexts: [],
    comboText: "ROAST ROYALE!",
    squashDuration: 350,
  },
] as const;

export type AttackId = typeof ATTACKS[number]["id"];

export const VICTORY_MESSAGES: ((name: string) => string)[] = [
  (name) => `${name} has been defeated by direct communication.`,
  (name) => `${name} has left the building with a tiny clipboard.`,
  (name) => `${name} just got absolutely cooked by perspective.`,
  (name) => `${name} filed for emotional bankruptcy.`,
  (name) => `${name} has disconnected from the bad-vibes network.`,
  (name) => `${name} called. You didn't pick up.`,
  (name) => `${name} has been reported to the karma department.`,
];

export const KO_TEXTS = ["💥 K.O.!!", "🏆 FINISHED!!", "✨ RELEASED!!", "⚡ GAME OVER!!"];

export const FALLBACK_REACTIONS = [
  "That's not what I said!",
  "You're too sensitive.",
  "I was only trying to help!",
  "Why is everyone reacting?",
  "That's completely unfair.",
  "I'm somehow the victim here.",
];
