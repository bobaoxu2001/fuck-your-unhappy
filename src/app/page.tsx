"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, MonsterData, ReleaseSummaryData } from "@/lib/types";
import { generateMonster, rerollMonster } from "@/lib/mockMonsters";
import VentInput from "@/components/VentInput";
import CharacterReveal from "@/components/CharacterReveal";
import VentArena from "@/components/VentArena";
import ReleaseSummary from "@/components/ReleaseSummary";

function buildSummary(monster: MonsterData, hitCount: number, bestCombo: number): ReleaseSummaryData {
  const roasts = [
    `${monster.name} didn't stand a chance against your rage.`,
    `That was personal. ${monster.name} is filing a restraining order.`,
    `You hit so hard, ${monster.name}'s therapist needs a therapist.`,
    `${monster.name} has left the chat. Permanently.`,
    `${monster.name} just ragequit existence.`,
  ];

  const headlines = [
    "TARGET DESTROYED",
    "EMOTIONAL VICTORY",
    "BOSS ELIMINATED",
    "RAGE COMPLETE",
  ];

  const stressReduced = Math.min(100, Math.round(40 + hitCount * 3 + bestCombo * 5));

  return {
    monsterName: monster.name,
    hitCount,
    bestCombo,
    stressReduced,
    headline: headlines[Math.floor(Math.random() * headlines.length)],
    roastLine: roasts[Math.floor(Math.random() * roasts.length)],
    emoji: hitCount >= 15 ? "👑" : "🏆",
  };
}

/* ─── Shared Header ─── */
function AppHeader() {
  return (
    <header className="w-full flex items-center gap-2 px-4 pt-3 pb-2">
      <div className="w-7 h-7 rounded-full bg-brand-yellow flex items-center justify-center text-xs font-black">
        😤
      </div>
      <h1 className="font-display text-[22px] tracking-wide leading-none">
        <span className="text-black">FUCK&nbsp;YOUR</span>
        <span className="yellow-highlight ml-1 text-black">UNHAPPY</span>
      </h1>
    </header>
  );
}

/* ─── Bottom Navigation ─── */
function BottomNav({ screen }: { screen: Screen }) {
  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white z-50 flex items-end justify-around px-6 pb-5 pt-3 max-w-md mx-auto">
      <button className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className={`text-xl ${screen === "input" || screen === "reveal" || screen === "arena" ? "opacity-100" : "opacity-40"}`}>
          👾
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Monsters
        </span>
      </button>

      <button className="relative -top-5 w-16 h-16 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg border-4 border-white">
        <span className="text-2xl">⚡</span>
      </button>

      <button className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className={`text-xl ${screen === "summary" ? "opacity-100" : "opacity-40"}`}>
          📜
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          History
        </span>
      </button>
    </nav>
  );
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
      {/* Top gradient bar matching Stitch design */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-pink via-brand-yellow to-brand-pink z-50" />
      <AppHeader />

      <main className="flex-1 flex items-start justify-center px-2 pt-2 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          {screen === "input" && (
            <motion.div key="input" exit={{ opacity: 0, x: -50 }} className="w-full">
              <VentInput onSubmit={handleVent} />
            </motion.div>
          )}
          {screen === "reveal" && monster && (
            <motion.div key="reveal" exit={{ opacity: 0, x: -50 }} className="w-full">
              <CharacterReveal monster={monster} onReady={handleReady} onReroll={handleReroll} />
            </motion.div>
          )}
          {screen === "arena" && monster && (
            <motion.div key="arena" exit={{ opacity: 0, x: -50 }} className="w-full">
              <VentArena monster={monster} onFinish={handleFinish} />
            </motion.div>
          )}
          {screen === "summary" && summary && (
            <motion.div key="summary" exit={{ opacity: 0, x: -50 }} className="w-full">
              <ReleaseSummary data={summary} onRestart={handleRestart} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav screen={screen} />
    </div>
  );
}
