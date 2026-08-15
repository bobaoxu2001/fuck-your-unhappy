import type { MonsterData } from "./types";

export interface DailyBoss {
  id: string;
  monster: MonsterData;
  headline: string;
  challengeCopy: string;
  collectibleLabel: string;
}

const DAY_MS = 86_400_000;
const MAX_CHALLENGE_SECONDS = 300;
const CHALLENGE_SECONDS_PARAM = "time";

export const DAILY_BOSSES: readonly DailyBoss[] = [
  {
    id: "monday-meeting-moth",
    headline: "Today’s public nuisance",
    challengeCopy: "This meeting has an agenda. Unfortunately, it is another meeting.",
    collectibleLabel: "Meeting Moth",
    monster: {
      name: "Monday Meeting Moth",
      emoji: "🦋",
      archetype: "calendar moth",
      appearance: "A fuzzy purple moth in a tiny blazer, eating the useful parts of a calendar.",
      description: "A public, fictional boss formed from meetings that should have been three bullet points.",
      personality: "Polite, circular, and deeply committed to having a pre-meeting meeting.",
      crime: "Turning twenty minutes into an afternoon",
      toxicSkill: "Agenda camouflage",
      weakness: "A decision with an owner",
      finalRoast: "Your action items have been reassigned to the moon.",
      diagnosis: "Chronic calendar fluttering",
      battleIntro: "The moth opens twelve slides and says, ‘This should be quick.’",
      victoryMessage: "The meeting ended with seven minutes returned to civilization.",
      color: "#8B5CF6",
      keywords: [],
      taunts: ["Let’s wait for everyone.", "One quick thought.", "Can everyone see my screen?"],
      reactions: ["That was off-agenda!", "We need a follow-up!", "Who owns this?", "I’ll send notes eventually."],
      aura: "calendar congestion",
      vibe: "corporate",
      fallback: true,
    },
  },
  {
    id: "reply-all-hydra",
    headline: "Inbox raid of the day",
    challengeCopy: "Cut one email thread and three unnecessary replies appear.",
    collectibleLabel: "Reply-All Hydra",
    monster: {
      name: "Reply-All Hydra",
      emoji: "🐲",
      archetype: "inbox hydra",
      appearance: "A three-headed email dragon wearing notification badges like jewelry.",
      description: "A public, fictional boss powered by acknowledgements sent to the entire company.",
      personality: "Loud, redundant, and delighted to add one more person to the thread.",
      crime: "Multiplying one email into forty-seven",
      toxicSkill: "Notification regeneration",
      weakness: "Move to BCC",
      finalRoast: "Unsubscribe means from your whole personality.",
      diagnosis: "Acute inbox hydramatosis",
      battleIntro: "The Hydra forwards the arena back to everyone ‘for visibility.’",
      victoryMessage: "The thread has been muted and the kingdom is quiet again.",
      color: "#EC4899",
      keywords: [],
      taunts: ["Thanks!", "+1", "Looping everyone in."],
      reactions: ["Adding context!", "Please advise!", "Circling back!", "For awareness!"],
      aura: "reply-all static",
      vibe: "corporate",
      fallback: true,
    },
  },
  {
    id: "buffering-basilisk",
    headline: "Connection problem detected",
    challengeCopy: "It can freeze a video call with one judgmental stare.",
    collectibleLabel: "Buffering Basilisk",
    monster: {
      name: "Buffering Basilisk",
      emoji: "🦎",
      archetype: "loading-screen lizard",
      appearance: "A neon lizard coiled around a router, with a spinning wheel for one eye.",
      description: "A public, fictional boss born whenever Wi-Fi fails at exactly the important sentence.",
      personality: "Laggy, smug, and somehow strongest beside the router.",
      crime: "Freezing every important sentence",
      toxicSkill: "Infinite loading stare",
      weakness: "Turning it off and on again",
      finalRoast: "Even your defeat is stuck at ninety-nine percent.",
      diagnosis: "Terminal spinning-wheel syndrome",
      battleIntro: "The Basilisk joins the arena with audio but no video.",
      victoryMessage: "The signal returned and the Basilisk dropped to one bar.",
      color: "#06B6D4",
      keywords: [],
      taunts: ["You’re frozen.", "Can you hear me?", "Reconnecting…"],
      reactions: ["Bad connection!", "Try again!", "Audio only!", "Still loading!"],
      aura: "buffering fog",
      vibe: "online",
      fallback: true,
    },
  },
  {
    id: "deadline-doug",
    headline: "Due yesterday, apparently",
    challengeCopy: "He brought panic confetti and forgot the actual plan.",
    collectibleLabel: "Deadline Doug",
    monster: {
      name: "Deadline Doug",
      emoji: "🤡",
      archetype: "deadline clown",
      appearance: "A circus clown juggling overdue tasks, cold coffee, and one burning calendar.",
      description: "A public, fictional boss fueled by vague requirements and last-minute urgency.",
      personality: "Frantic, loud, and powered entirely by fake urgency.",
      crime: "Arriving late with panic confetti",
      toxicSkill: "Fake urgency fog machine",
      weakness: "One realistic next step",
      finalRoast: "Congratulations, you lost to a to-do list.",
      diagnosis: "Acute calendar clownery",
      battleIntro: "Doug honks into battle yelling that everything was due yesterday.",
      victoryMessage: "Deadline Doug has been rescheduled into the sun.",
      color: "#F97316",
      keywords: [],
      taunts: ["Due in five minutes!", "No pressure!", "Tiny scope change!"],
      reactions: ["That wasn’t in scope!", "Time is a construct!", "One more revision!", "Why so calm?"],
      aura: "manufactured urgency",
      vibe: "school",
      fallback: true,
    },
  },
  {
    id: "laundry-chair-lich",
    headline: "The chair has evolved",
    challengeCopy: "Not clean. Not dirty. Somehow now sentient.",
    collectibleLabel: "Laundry Chair Lich",
    monster: {
      name: "Laundry Chair Lich",
      emoji: "🪑",
      archetype: "domestic fabric lich",
      appearance: "A haunted chair wearing seven hoodies and a single mysterious sock crown.",
      description: "A public, fictional boss representing the pile everyone agrees is temporary.",
      personality: "Layered, judgmental, and structurally dependent on one pair of jeans.",
      crime: "Becoming permanent furniture",
      toxicSkill: "Outfit avalanche",
      weakness: "A ten-minute reset",
      finalRoast: "You are a wardrobe with commitment issues.",
      diagnosis: "Advanced textile haunting",
      battleIntro: "The Lich creaks forward under the weight of three unfinished outfits.",
      victoryMessage: "The chair has legally become a chair again.",
      color: "#22C55E",
      keywords: [],
      taunts: ["Wear me again.", "Not dirty enough.", "Deal with me later."],
      reactions: ["Mind the sock!", "I was organized!", "That hoodie lives here!", "Not the jeans!"],
      aura: "domestic limbo",
      vibe: "general",
      fallback: true,
    },
  },
  {
    id: "group-chat-gargoyle",
    headline: "Thirty-nine unread omens",
    challengeCopy: "It wakes whenever someone types ‘we need to talk.’",
    collectibleLabel: "Chat Gargoyle",
    monster: {
      name: "Group Chat Gargoyle",
      emoji: "🗿",
      archetype: "notification gargoyle",
      appearance: "A stone gargoyle perched on a cracked phone, blinking with thirty-nine badges.",
      description: "A public, fictional boss made from ambiguous reactions and missing context.",
      personality: "Cryptic, online at 2 a.m., and fluent in the ominous thumbs-up.",
      crime: "Turning one message into a social mystery",
      toxicSkill: "Typing-bubble suspense",
      weakness: "A direct question",
      finalRoast: "Your vague emoji has been admitted into evidence.",
      diagnosis: "Severe context deficiency",
      battleIntro: "The Gargoyle appears, reacts ‘k,’ and refuses to elaborate.",
      victoryMessage: "The chat has been muted without leaving the friendship.",
      color: "#64748B",
      keywords: [],
      taunts: ["K.", "Who told you?", "Never mind."],
      reactions: ["It’s fine!", "Wrong chat!", "No context!", "Seen 2:04 AM!"],
      aura: "notification suspense",
      vibe: "friendship",
      fallback: true,
    },
  },
  {
    id: "sunday-scaries-squid",
    headline: "Tomorrow is being dramatic",
    challengeCopy: "Eight arms, eight imaginary Monday emergencies.",
    collectibleLabel: "Scaries Squid",
    monster: {
      name: "Sunday Scaries Squid",
      emoji: "🦑",
      archetype: "anticipation squid",
      appearance: "A tiny purple squid holding eight planners, none of which contain Sunday.",
      description: "A public, fictional boss that tries to make tomorrow consume the rest of today.",
      personality: "Forecasting, clingy, and suspicious of unstructured evenings.",
      crime: "Stealing Sunday for Monday",
      toxicSkill: "Eight-arm future tripping",
      weakness: "One plan, then present time",
      finalRoast: "Tomorrow called. It asked you to stop doing its shift.",
      diagnosis: "Premature Monday exposure",
      battleIntro: "The Squid arrives early for a problem that has not happened.",
      victoryMessage: "Tomorrow has been returned to its proper timezone.",
      color: "#7C3AED",
      keywords: [],
      taunts: ["What about Monday?", "Plan it again.", "Enjoyment seems risky."],
      reactions: ["But tomorrow!", "Check the calendar!", "Stay prepared!", "Relax later!"],
      aura: "premature Monday",
      vibe: "general",
      fallback: true,
    },
  },
];

const DAILY_BOSS_BY_ID = new Map(DAILY_BOSSES.map((boss) => [boss.id, boss]));

export function getUtcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isUtcDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp)) return false;
  return new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function getUtcDateKey(value: Date | string = new Date()): string {
  if (typeof value === "string" && isUtcDateKey(value)) return value;
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) throw new Error("Invalid date");
  return getUtcDayKey(date);
}

export function getDailyBossForDay(dayKey: string): DailyBoss {
  const validDay = isUtcDateKey(dayKey) ? dayKey : "2026-01-01";
  const dayNumber = Math.floor(Date.parse(`${validDay}T00:00:00.000Z`) / DAY_MS);
  const index = ((dayNumber % DAILY_BOSSES.length) + DAILY_BOSSES.length) % DAILY_BOSSES.length;
  return DAILY_BOSSES[index];
}

export function getDailyBoss(date = new Date()): DailyBoss {
  return getDailyBossForDay(getUtcDayKey(date));
}

export function getNextDailyBoss(date = new Date()): DailyBoss {
  const tomorrow = new Date(date.getTime() + DAY_MS);
  return getDailyBoss(tomorrow);
}

export function getDailyBossById(id: string | null | undefined): DailyBoss | null {
  if (!id) return null;
  return DAILY_BOSS_BY_ID.get(id) ?? null;
}

function normalizeChallengeSeconds(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  if (value < 1 || value > MAX_CHALLENGE_SECONDS) return null;
  return value;
}

function readChallengeParams(search: string | URLSearchParams): URLSearchParams {
  return typeof search === "string"
    ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
    : search;
}

export function buildSafeChallengeUrl(
  baseUrl: string,
  bossId: string,
  completionSeconds?: number | null,
): string | null {
  const boss = getDailyBossById(bossId);
  if (!boss) return null;

  try {
    const url = new URL(baseUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.username = "";
    url.password = "";
    url.pathname = "/";
    url.search = "";
    url.hash = "";
    url.searchParams.set("challenge", boss.id);
    const safeSeconds = normalizeChallengeSeconds(completionSeconds);
    if (safeSeconds !== null) {
      url.searchParams.set(CHALLENGE_SECONDS_PARAM, String(safeSeconds));
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function readSafeChallenge(search: string | URLSearchParams): DailyBoss | null {
  const params = readChallengeParams(search);
  return getDailyBossById(params.get("challenge"));
}

export function readSafeChallengeBenchmark(search: string | URLSearchParams): number | null {
  const params = readChallengeParams(search);
  if (!getDailyBossById(params.get("challenge"))) return null;

  const rawSeconds = params.get(CHALLENGE_SECONDS_PARAM);
  if (!rawSeconds || !/^[1-9]\d{0,2}$/.test(rawSeconds)) return null;
  return normalizeChallengeSeconds(Number(rawSeconds));
}
