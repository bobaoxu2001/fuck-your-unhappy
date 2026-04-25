import { MonsterData } from "./types";

const monsters: MonsterData[] = [
  {
    name: "Karen the Complainer",
    emoji: "👹",
    archetype: "complaint goblin",
    appearance: "A clipboard goblin wearing three lanyards and a permanent disappointed squint.",
    description:
      "Born from unread emails and passive-aggressive Slack messages. She weaponizes tiny inconveniences into full meetings.",
    personality: "Nitpicky, performatively exhausted, and allergic to accountability.",
    weakness: "Being ignored",
    battleIntro: "Karen slides into the arena holding a calendar invite nobody asked for.",
    victoryMessage: "The complaint goblin has been muted, archived, and emotionally unsubscribed.",
    color: "#FF6B6B",
    keywords: ["boss", "work", "coworker", "manager", "email", "meeting"],
    taunts: ["Per my last email.", "Let's circle back.", "I need this ASAP."],
    reactions: ["That's not what I meant.", "You're being difficult.", "Everyone else understood me.", "I was just helping."],
    aura: "passive aggression",
    vibe: "corporate",
  },
  {
    name: "Deadline Doug",
    emoji: "🤡",
    archetype: "deadline clown",
    appearance: "A circus clown juggling overdue tasks, cold coffee, and one burning calendar.",
    description:
      "Feeds on your procrastination and grows stronger every hour you scroll TikTok. Has never been on time for anything.",
    personality: "Frantic, loud, and powered entirely by fake urgency.",
    weakness: "Actual planning",
    battleIntro: "Deadline Doug honks into battle yelling that everything was due yesterday.",
    victoryMessage: "Deadline Doug has been rescheduled into the sun.",
    color: "#FFA94D",
    keywords: ["deadline", "late", "time", "project", "homework", "exam"],
    taunts: ["Due in five minutes!", "No pressure, obviously.", "This is urgent-ish."],
    reactions: ["I warned you vaguely.", "That's not in scope.", "Time is a construct.", "Why are you blaming me?"],
    aura: "manufactured urgency",
    vibe: "school",
  },
  {
    name: "Anxiety Andy",
    emoji: "👻",
    archetype: "worry phantom",
    appearance: "A translucent ghost clutching a notebook labeled Worst Case Scenarios.",
    description:
      'Whispers worst-case scenarios at 3am. Allergic to deep breaths. His catchphrase is "but what if..."',
    personality: "Jumpy, dramatic, and convinced every notification is a prophecy.",
    weakness: "Touching grass",
    battleIntro: "Anxiety Andy floats in with seventeen backup plans and zero chill.",
    victoryMessage: "Anxiety Andy has been wrapped in a weighted blanket and sent to voicemail.",
    color: "#9775FA",
    keywords: ["anxiety", "worry", "scared", "nervous", "stress", "panic"],
    taunts: ["But what if?", "Check it again.", "Something feels off."],
    reactions: ["I'm trying to protect you.", "This is realistic.", "You forgot something.", "Don't relax yet."],
    aura: "catastrophe fog",
    vibe: "general",
  },
  {
    name: "Rage Rita",
    emoji: "👺",
    archetype: "rage gremlin",
    appearance: "A tiny red gremlin with steam ears and a parking ticket cape.",
    description:
      "Manifested from road rage and slow WiFi. Surprisingly short. Will fight anyone over a parking spot.",
    personality: "Explosive, petty, and deeply offended by loading spinners.",
    weakness: "Counting to ten",
    battleIntro: "Rage Rita stomps in, furious that the arena has terms and conditions.",
    victoryMessage: "Rage Rita has been unplugged from the outrage machine.",
    color: "#FF8787",
    keywords: ["angry", "mad", "rage", "traffic", "slow", "stupid"],
    taunts: ["Say that again.", "I'm perfectly calm.", "Move faster."],
    reactions: ["I didn't yell.", "You started it.", "This is your fault.", "I'm just passionate."],
    aura: "boiling impatience",
    vibe: "general",
  },
  {
    name: "Overthink Ollie",
    emoji: "🧠",
    archetype: "spiral scholar",
    appearance: "A giant brain in glasses carrying a 900-page book of imaginary problems.",
    description:
      'Replays embarrassing moments from 2014 on loop. Never sleeps. Still cringing about that thing you said in 7th grade.',
    personality: "Analytical, dramatic, and unable to leave a thought unchewed.",
    weakness: "Living in the moment",
    battleIntro: "Overthink Ollie enters after rehearsing this exact entrance 42 times.",
    victoryMessage: "Overthink Ollie has closed all tabs and accepted 'good enough'.",
    color: "#66D9E8",
    keywords: ["think", "regret", "cringe", "embarrass", "past", "why"],
    taunts: ["Let's analyze this.", "Remember 2014?", "Maybe they hate you."],
    reactions: ["I'm being thorough.", "One more scenario.", "This matters deeply.", "You missed a detail."],
    aura: "analysis paralysis",
    vibe: "general",
  },
  {
    name: "Ghosting Gary",
    emoji: "💀",
    archetype: "vanishing texter",
    appearance: "A skeleton hiding behind a phone with 47 unread messages.",
    description:
      "Left you on read 47 times. Invented the art of disappearing mid-conversation. Probably left this bio unfinished too—",
    personality: "Slippery, vague, and allergic to simple yes-or-no answers.",
    weakness: "Direct communication",
    battleIntro: "Ghosting Gary appears, disappears, then says he was 'super busy'.",
    victoryMessage: "Ghosting Gary has finally been delivered, read, and released.",
    color: "#868E96",
    keywords: ["ghost", "text", "reply", "friend", "ignore", "left"],
    taunts: ["Sorry, just saw this.", "Been so busy.", "Let's catch up soon."],
    reactions: ["My phone died.", "I typed a reply.", "You're overthinking it.", "I needed space."],
    aura: "avoidant mist",
    vibe: "dating",
  },
  {
    name: "Drama Debbie",
    emoji: "🎭",
    archetype: "chaos narrator",
    appearance: "A theater kid tornado wearing mascara, sequins, and a personal rain cloud.",
    description:
      "Turns a spilled coffee into a 3-act tragedy. Has her own soundtrack. Cries in 4K Ultra HD.",
    personality: "Grand, wounded, and always ready for a surprise monologue.",
    weakness: "Perspective",
    battleIntro: "Drama Debbie enters under a spotlight that she definitely brought herself.",
    victoryMessage: "Drama Debbie has exited stage left with fewer subtitles.",
    color: "#E599F7",
    keywords: ["drama", "cry", "sad", "emotional", "relationship", "breakup"],
    taunts: ["Nobody understands me.", "This is betrayal.", "I can't even."],
    reactions: ["I'm the victim here.", "You made this huge.", "That's so unfair.", "I feel attacked."],
    aura: "main character storm",
    vibe: "friendship",
  },
  {
    name: "Burnout Barry",
    emoji: "🔥",
    archetype: "burnout blob",
    appearance: "A melted office chair with eyebags, cereal crumbs, and one smoking laptop.",
    description:
      'Used to be productive. Now just stares at screens and eats cereal at 4pm. His spirit animal is a deflated balloon.',
    personality: "Tired, crispy, and one notification away from becoming furniture.",
    weakness: "A single vacation day",
    battleIntro: "Burnout Barry oozes into battle and asks if this could have been an email.",
    victoryMessage: "Burnout Barry has been granted one nap and a boundary.",
    color: "#FFC078",
    keywords: ["tired", "exhausted", "burnout", "sleep", "done", "quit"],
    taunts: ["I'm so tired.", "Just one more task.", "No days off."],
    reactions: ["I can still work.", "Rest is inefficient.", "I'm totally fine.", "Coffee counts as sleep."],
    aura: "crispy exhaustion",
    vibe: "corporate",
  },
];

/** Pick a monster that matches keywords in the user's vent, or fall back to random. */
export function generateMonster(userInput: string): MonsterData {
  const lower = userInput.toLowerCase();
  const matches = monsters.filter((m) =>
    m.keywords.some((kw) => lower.includes(kw))
  );
  const pool = matches.length > 0 ? matches : monsters;
  return { ...pool[Math.floor(Math.random() * pool.length)], fallback: true };
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
  return { ...pool[Math.floor(Math.random() * pool.length)], fallback: true };
}

export function generateSafeFallbackMonster(): MonsterData {
  return {
    name: "Heavy Cloud Harold",
    emoji: "🫠",
    archetype: "overwhelm cloud",
    appearance: "A soggy cartoon cloud wearing tiny boots and carrying too many tabs.",
    description:
      "This is not a real person. It is the weird heavy feeling that shows up when stress gets too loud.",
    personality: "Dramatic, foggy, and surprisingly easy to shrink with one tiny action.",
    weakness: "One small next step",
    battleIntro: "Heavy Cloud Harold drifts in, blocking the sun with a spreadsheet of worries.",
    victoryMessage: "The heavy cloud has been squeezed into a tiny harmless puff.",
    color: "#74C0FC",
    keywords: [],
    taunts: ["I'm too much.", "Stay stuck here.", "Everything is urgent."],
    reactions: ["Okay, one step helps.", "I can shrink.", "That felt lighter.", "Maybe breathe first."],
    aura: "heavy overwhelm",
    vibe: "general",
    fallback: true,
  };
}
