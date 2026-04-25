export interface ToolConfig {
  id: string;
  label: string;
  emoji: string;
  feeling: string;
  hitTexts: readonly string[];
  comboTexts: readonly string[];
  color: string;
}

export const TOOLS: readonly ToolConfig[] = [
  {
    id: "slipper",
    label: "Slipper",
    emoji: "🩴",
    feeling: "silly, classic, quick smack",
    hitTexts: ["SMACK!", "SLIPPER JUSTICE!", "WHAP!", "SLAP!", "CHANCLA!", "THWACK!"],
    comboTexts: ["SLIPPER FRENZY!", "CHANCLA COMBO!", "SMACK ATTACK!"],
    color: "#FF6B6B",
  },
  {
    id: "hammer",
    label: "Hammer",
    emoji: "🔨",
    feeling: "heavy impact",
    hitTexts: ["BONK!", "SQUISH!", "CORPORATE CONFETTI!", "SMOOSH!", "FLATTENED EGO!", "BOUNCE!"],
    comboTexts: ["HAMMER TIME!", "TOTAL SQUISH!", "GROUND BOOP!"],
    color: "#7C3AED",
  },
  {
    id: "chicken",
    label: "Rubber Chicken",
    emoji: "🐔",
    feeling: "absurd, chaotic, squeaky",
    hitTexts: ["SQUEAK ATTACK!", "HONK OF DOOM!", "CHAOS CHICKEN!", "BAWK!", "CLUCK STRIKE!", "FOWL PLAY!"],
    comboTexts: ["CHICKEN FRENZY!", "POULTRY COMBO!", "CLUCKING MADNESS!"],
    color: "#FFA94D",
  },
  {
    id: "coffee",
    label: "Coffee Splash",
    emoji: "☕",
    feeling: "caffeinated chaos",
    hitTexts: ["CAFFEINE STRIKE!", "HOT MESS!", "SPILL DAMAGE!", "LATTE SLAP!", "BREW BLAST!", "DRIP DROP!"],
    comboTexts: ["ESPRESSO EXPRESS!", "TRIPLE SHOT!", "CAFFEINE OVERDOSE!"],
    color: "#8B4513",
  },
  {
    id: "keyboard",
    label: "Keyboard",
    emoji: "⌨️",
    feeling: "office rage / digital silliness",
    hitTexts: ["CTRL+ALT+RELIEF!", "KEYBOARD RAGE!", "TYPING CHAOS!", "KEY SMASH!", "ENTER STRIKE!", "CAPS LOCK!"],
    comboTexts: ["RAGE TYPING!", "KEYBOARD WARRIOR!", "MECHANICAL MAYHEM!"],
    color: "#06B6D4",
  },
] as const;

export function getTool(id: string): ToolConfig {
  return TOOLS.find((t) => t.id === id) ?? TOOLS[0];
}
