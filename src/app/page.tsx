"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, MonsterData, ReleaseSummaryData } from "@/lib/types";
import { generateMonsterAI, rerollMonsterAI } from "@/lib/generateMonster";
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
  const [generating, setGenerating] = useState(false);

  const handleVent = async (text: string) => {
    setUserInput(text);
    setGenerating(true);
    const m = await generateMonsterAI(text);
    setMonster(m);
    setGenerating(false);
    setScreen("reveal");
  };

  const handleReroll = async () => {
    if (!monster) return;
    setGenerating(true);
    const m = await rerollMonsterAI(userInput, monster);
    setMonster(m);
    setGenerating(false);
  };

  const handleFinish = (hitCount: number, bestCombo: number, sceneId?: string, toolId?: string) => {
    if (monster) {
      const data = buildSummary(monster, hitCount, bestCombo);
      data.sceneId = sceneId;
      data.toolId = toolId;
      setSummary(data);
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

      <main className="flex-1 flex items-start justify-center px-2 pt-2 pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          {screen === "input" && (
            <motion.div key="input" exit={EXIT_ANIMATION} className="w-full">
              <VentInput onSubmit={handleVent} loading={generating} />
            </motion.div>
          )}
          {screen === "reveal" && monster && (
            <motion.div key="reveal" exit={EXIT_ANIMATION} className="w-full">
              <CharacterReveal
                monster={monster}
                onReady={() => setScreen("arena")}
                onReroll={handleReroll}
                loading={generating}
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
