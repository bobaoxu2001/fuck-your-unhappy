export interface SceneConfig {
  id: string;
  label: string;
  emoji: string;
  tone: string;
  bgClass: string;
  hitTexts: readonly string[];
  flavorTexts: readonly string[];
  particles: readonly string[];
}

export const SCENES: readonly SceneConfig[] = [
  {
    id: "office",
    label: "Office",
    emoji: "🏢",
    tone: "workplace frustration",
    bgClass: "scene-office",
    hitTexts: [
      "EMOTIONAL DAMAGE",
      "MEETING OVERLOAD",
      "CIRCLE BACK SMASH",
      "SLACK ATTACK",
      "INBOX ZERO'D",
      "SYNERGY STRIKE",
      "DEADLINE CRUSH",
      "HR VIOLATION",
    ],
    flavorTexts: [
      "Your boss felt that one",
      "That email chain is OVER",
      "Meeting adjourned... permanently",
      "Performance review: DESTROYED",
    ],
    particles: ["📎", "💼", "📊", "🔔", "📧", "☕"],
  },
  {
    id: "classroom",
    label: "Classroom",
    emoji: "🏫",
    tone: "school / exam stress",
    bgClass: "scene-classroom",
    hitTexts: [
      "POP QUIZ PAIN",
      "MENTAL BREAKDOWN",
      "CHALK STRIKE",
      "EXAM BONK",
      "GRADE GOBLIN",
      "HOMEWORK HAVOC",
      "TEACHER'S NIGHTMARE",
      "BELL RINGER",
    ],
    flavorTexts: [
      "That test didn't stand a chance",
      "Extra credit: CHAOS",
      "Class dismissed... forever",
      "Straight A's in destruction",
    ],
    particles: ["📝", "📚", "✏️", "🎒", "📐", "🍎"],
  },
  {
    id: "home",
    label: "Home",
    emoji: "🏠",
    tone: "domestic chaos",
    bgClass: "scene-home",
    hitTexts: [
      "DOMESTIC CHAOS",
      "CLEANUP STRIKE",
      "SLIPPER JUSTICE",
      "HOUSEHOLD HAVOC",
      "CHORE WARFARE",
      "DISH DESTRUCTION",
      "LAUNDRY RAGE",
      "REMOTE CONTROL",
    ],
    flavorTexts: [
      "The dishes are DONE",
      "Roommate has been notified",
      "Chore list: OBLITERATED",
      "Passive-aggressive note SENT",
    ],
    particles: ["🧹", "🍳", "🛋️", "🧦", "📺", "🩴"],
  },
] as const;

export function getScene(id: string): SceneConfig {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
