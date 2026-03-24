"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, MonsterData, ReleaseSummaryData } from "@/lib/types";
import { generateMonster, rerollMonster } from "@/lib/mockMonsters";
import { buildSummary } from "@/lib/buildSummary";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import VentInput from "@/components/VentInput";
import CharacterReveal from "@/components/CharacterReveal";
import VentArena from "@/components/VentArena";
import ReleaseSummary from "@/components/ReleaseSummary";

const EXIT_ANIMATION = { opacity: 0, x: -50 };

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
    if (monster) setMonster(rerollMonster(userInput, monster));
  };

  const handleFinish = (hitCount: number, bestCombo: number) => {
    if (monster) {
      setSummary(buildSummary(monster, hitCount, bestCombo));
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
    <div className="flex flex-col min-h-dvh max-w-md mx-auto bg-[#FAF5FF] relative">
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-pink via-brand-yellow to-brand-pink z-50" />
      <AppHeader />

      <main className="flex-1 flex items-start justify-center px-2 pt-2 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          {screen === "input" && (
            <motion.div key="input" exit={EXIT_ANIMATION} className="w-full">
              <VentInput onSubmit={handleVent} />
            </motion.div>
          )}
          {screen === "reveal" && monster && (
            <motion.div key="reveal" exit={EXIT_ANIMATION} className="w-full">
              <CharacterReveal
                monster={monster}
                onReady={() => setScreen("arena")}
                onReroll={handleReroll}
              />
            </motion.div>
          )}
          {screen === "arena" && monster && (
            <motion.div key="arena" exit={EXIT_ANIMATION} className="w-full">
              <VentArena monster={monster} onFinish={handleFinish} />
            </motion.div>
          )}
          {screen === "summary" && summary && (
            <motion.div key="summary" exit={EXIT_ANIMATION} className="w-full">
              <ReleaseSummary data={summary} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav screen={screen} />
    </div>
  );
}
