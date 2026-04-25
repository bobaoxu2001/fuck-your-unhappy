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
  const [generationError, setGenerationError] = useState("");

  const handleVent = async (text: string) => {
    if (generating) return;
    setUserInput(text);
    setGenerating(true);
    setGenerationError("");
    try {
      const m = await generateMonsterAI(text);
      setMonster(m);
      setScreen("reveal");
    } catch {
      setGenerationError("The monster portal jammed. Try a shorter vent or summon again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleReroll = async () => {
    if (!monster || generating) return;
    setGenerating(true);
    try {
      const m = await rerollMonsterAI(userInput, monster);
      setMonster(m);
    } finally {
      setGenerating(false);
    }
  };

  const handleFinish = (
    hitCount: number,
    bestCombo: number,
    sceneId?: string,
    toolId?: string,
    totalDamage?: number,
    maxSingleHit?: number,
    rageActivations?: number,
  ) => {
    if (monster) {
      const data = buildSummary(monster, hitCount, bestCombo, totalDamage, maxSingleHit, rageActivations);
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
    setGenerationError("");
    setScreen("input");
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#FFE4F3_0,#FAF5FF_34%,#E0F2FE_100%)] text-gray-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col relative overflow-hidden">
        <div className="pointer-events-none absolute -top-28 -right-20 h-72 w-72 rounded-full bg-brand-yellow/30 blur-3xl" />
        <div className="pointer-events-none absolute top-44 -left-24 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-pink via-brand-yellow to-brand-cyan z-50" />
        <AppHeader />

        <main className="relative z-10 flex-1 flex items-start justify-center px-3 pt-2 pb-28 overflow-y-auto md:px-6 md:pt-6">
          <AnimatePresence mode="wait">
            {screen === "input" && (
              <motion.div key="input" exit={EXIT_ANIMATION} className="w-full">
                <VentInput onSubmit={handleVent} loading={generating} error={generationError} />
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
    </div>
  );
}
