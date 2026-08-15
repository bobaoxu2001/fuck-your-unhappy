export const HP_MAX = 260;
export const RAGE_MAX = 100;
export const RAGE_DURATION = 5000;
export const COMBO_TIMEOUT = 1000;
export const FLOAT_DURATION = 700;
export const ATTACK_COOLDOWN = 140;

export const ATTACKS = [
  {
    id: "slap",
    label: "Bonk",
    emoji: "🩴",
    detail: "builds combo",
    minDmg: 11,
    maxDmg: 16,
    rageFill: 20,
    color: "#FF6B6B",
    textColor: "#17140F",
    floatColor: "#FF6B6B",
    texts: ["SMACK!", "WHAP!", "THWACK!", "PETTY BONK!", "CHANCLA!", "AUDIT SLAP!"],
    extraTexts: ["ego dented.", "sit down.", "rude but fair.", "again!", "noted.", "tiny dignity loss."],
    comboText: "SLAP RECEIPT!",
    squashDuration: 120,
  },
  {
    id: "punch",
    label: "Smush",
    emoji: "💥",
    detail: "breaks guard",
    minDmg: 20,
    maxDmg: 28,
    rageFill: 24,
    color: "#7C3AED",
    textColor: "#FFFFFF",
    floatColor: "#7C3AED",
    texts: ["BONK!", "POW!!", "SMUSH!!", "HUMBLE PIE!", "BOUNDARY CHECK!"],
    extraTexts: [],
    comboText: "MEGA HUMBLING!",
    squashDuration: 200,
  },
  {
    id: "roast",
    label: "Roast",
    emoji: "🎤",
    detail: "stops rants",
    minDmg: 14,
    maxDmg: 23,
    rageFill: 30,
    color: "#FFD600",
    textColor: "#17140F",
    floatColor: "#9333EA",
    texts: ["THERAPY BILL!", "PSYCHIC DAMAGE!", "CRINGE OVERLOAD!", "RECEIPTS SUBMITTED!", "EMOTIONAL TAX!"],
    extraTexts: [],
    comboText: "ROAST ROYALE!",
    squashDuration: 350,
  },
] as const;

export type AttackId = typeof ATTACKS[number]["id"];

export const HIT_MESSAGES: ((name: string, damage: number) => string)[] = [
  (name, damage) => `${name} took ${damage} damage to the ego.`,
  (name, damage) => `${damage} damage. Their argument is now buffering.`,
  (name) => `${name} got hit right in the bad excuse.`,
  (_name, damage) => `${damage} damage and one tiny violin revoked.`,
  (name, damage) => `${name} dropped ${damage} points of fake confidence.`,
  (_name, damage) => `${damage} damage. The vibes are filing a complaint.`,
];

export const VICTORY_MESSAGES: ((name: string) => string)[] = [
  (name) => `${name} has been defeated by one clean boundary and a cartoon shoe.`,
  (name) => `${name} has left the building with a tiny clipboard and no leverage.`,
  (name) => `${name} just got absolutely cooked by perspective.`,
  (name) => `${name} filed for emotional bankruptcy and lost the pen.`,
  (name) => `${name} has disconnected from the bad-vibes network.`,
  (name) => `${name} called. You sent it straight to character development.`,
  (name) => `${name} has been reported to the karma department.`,
];

export const KO_TEXTS = ["💥 K.O.!!", "🏆 COOKED!!", "✨ RELEASED!!", "⚡ VIBE CLEARED!!"];

export const FINISHERS = [
  { id: "released", label: "RELEASED!!", emoji: "✨" },
  { id: "cooked", label: "COOKED!!", emoji: "🏆" },
  { id: "vibe-cleared", label: "VIBE CLEARED!!", emoji: "⚡" },
] as const;

export const FALLBACK_REACTIONS = [
  "That's not what I said!",
  "You're too sensitive.",
  "I was only trying to help!",
  "Why is everyone reacting?",
  "That's completely unfair.",
  "I'm somehow the victim here.",
];
