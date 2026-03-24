"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, MonsterData, ReleaseSummaryData } from "@/lib/types";
import { generateMonster, rerollMonster } from "@/lib/mockMonsters";
import VentInput from "@/components/VentInput";
import CharacterReveal from "@/components/CharacterReveal";
import VentArena from "@/components/VentArena";
import ReleaseSummary from "@/components/ReleaseSummary";

function buildSummary(monster: MonsterData, hitCount: number): ReleaseSummaryData {
  const roasts = [
    `${monster.name} didn't stand a chance against your rage.`,
    `That was personal. ${monster.name} is filing a restraining order.`,
    `You hit so hard, ${monster.name}'s therapist needs a therapist.`,
    `${monster.name} has left the chat. Permanently.`,
  ];

  let stressLevel: string;
  if (hitCount >= 18) stressLevel = "You were UNHINGED 🔥";
  else if (hitCount >= 12) stressLevel = "Solid rage session 💪";
  else if (hitCount >= 6) stressLevel = "Light therapy 😌";
  else stressLevel = "Just a love tap 🤏";

  return {
    monsterName: monster.name,
    hitCount,
    stressLevel,
    roastLine: roasts[Math.floor(Math.random() * roasts.length)],
    emoji: "🏆",
  };
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [userInput, setUserInput] = useState("");
  const [monster, setMonster] = useState<MonsterData | null>(null);
  const [summary, setSummary] = useState<ReleaseSummaryData | null>(null);

  const handleVent = (text: string) => {
    setUserInput(text);
    setMonster(generateMonster(text));
    setScreen("reveal");
  };

  const handleReroll = () => {
    if (monster) {
      setMonster(rerollMonster(userInput, monster));
    }
  };

  const handleReady = () => setScreen("arena");

  const handleFinish = (hitCount: number) => {
    if (monster) {
      setSummary(buildSummary(monster, hitCount));
      setScreen("summary");
    }
  };

  const handleRestart = () => {
    setUserInput("");
    setMonster(null);
    setSummary(null);
    setScreen("input");
  };

  return (
    <main className="flex min-h-dvh items-start justify-center py-8 px-2 overflow-y-auto">
      <AnimatePresence mode="wait">
        {screen === "input" && (
          <motion.div key="input" exit={{ opacity: 0, x: -50 }}>
            <VentInput onSubmit={handleVent} />
          </motion.div>
        )}
        {screen === "reveal" && monster && (
          <motion.div key="reveal" exit={{ opacity: 0, x: -50 }}>
            <CharacterReveal monster={monster} onReady={handleReady} onReroll={handleReroll} />
          </motion.div>
        )}
        {screen === "arena" && monster && (
          <motion.div key="arena" exit={{ opacity: 0, x: -50 }}>
            <VentArena monster={monster} onFinish={handleFinish} />
          </motion.div>
        )}
        {screen === "summary" && summary && (
          <motion.div key="summary" exit={{ opacity: 0, x: -50 }}>
            <ReleaseSummary data={summary} onRestart={handleRestart} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
