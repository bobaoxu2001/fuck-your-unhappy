import { MonsterData } from "./types";

const monsters: MonsterData[] = [
  {
    name: "Karen the Complainer",
    emoji: "👹",
    description:
      "Born from a thousand unread emails and passive-aggressive Slack messages. Speaks exclusively in ALL CAPS.",
    weakness: "Being ignored",
    color: "#FF6B6B",
    keywords: ["boss", "work", "coworker", "manager", "email", "meeting"],
  },
  {
    name: "Deadline Doug",
    emoji: "🤡",
    description:
      "Feeds on your procrastination and grows stronger every hour you scroll TikTok. Has never been on time for anything.",
    weakness: "Actual planning",
    color: "#FFA94D",
    keywords: ["deadline", "late", "time", "project", "homework", "exam"],
  },
  {
    name: "Anxiety Andy",
    emoji: "👻",
    description:
      'Whispers worst-case scenarios at 3am. Allergic to deep breaths. His catchphrase is "but what if..."',
    weakness: "Touching grass",
    color: "#9775FA",
    keywords: ["anxiety", "worry", "scared", "nervous", "stress", "panic"],
  },
  {
    name: "Rage Rita",
    emoji: "👺",
    description:
      "Manifested from road rage and slow WiFi. Surprisingly short. Will fight anyone over a parking spot.",
    weakness: "Counting to ten",
    color: "#FF8787",
    keywords: ["angry", "mad", "rage", "traffic", "slow", "stupid"],
  },
  {
    name: "Overthink Ollie",
    emoji: "🧠",
    description:
      'Replays embarrassing moments from 2014 on loop. Never sleeps. Still cringing about that thing you said in 7th grade.',
    weakness: "Living in the moment",
    color: "#66D9E8",
    keywords: ["think", "regret", "cringe", "embarrass", "past", "why"],
  },
  {
    name: "Ghosting Gary",
    emoji: "💀",
    description:
      "Left you on read 47 times. Invented the art of disappearing mid-conversation. Probably left this bio unfinished too—",
    weakness: "Direct communication",
    color: "#868E96",
    keywords: ["ghost", "text", "reply", "friend", "ignore", "left"],
  },
  {
    name: "Drama Debbie",
    emoji: "🎭",
    description:
      "Turns a spilled coffee into a 3-act tragedy. Has her own soundtrack. Cries in 4K Ultra HD.",
    weakness: "Perspective",
    color: "#E599F7",
    keywords: ["drama", "cry", "sad", "emotional", "relationship", "breakup"],
  },
  {
    name: "Burnout Barry",
    emoji: "🔥",
    description:
      'Used to be productive. Now just stares at screens and eats cereal at 4pm. His spirit animal is a deflated balloon.',
    weakness: "A single vacation day",
    color: "#FFC078",
    keywords: ["tired", "exhausted", "burnout", "sleep", "done", "quit"],
  },
];

/** Pick a monster that matches keywords in the user's vent, or fall back to random. */
export function generateMonster(userInput: string): MonsterData {
  const lower = userInput.toLowerCase();
  const matches = monsters.filter((m) =>
    m.keywords.some((kw) => lower.includes(kw))
  );
  const pool = matches.length > 0 ? matches : monsters;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Get a different monster than the current one. */
export function rerollMonster(
  userInput: string,
  current: MonsterData
): MonsterData {
  const lower = userInput.toLowerCase();
  const matches = monsters.filter(
    (m) => m.name !== current.name && m.keywords.some((kw) => lower.includes(kw))
  );
  const pool =
    matches.length > 0
      ? matches
      : monsters.filter((m) => m.name !== current.name);
  return pool[Math.floor(Math.random() * pool.length)];
}
