"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Screen, MonsterData, ReleaseSummaryData, BattleRecord } from "@/lib/types";
import { generateCharacterImage, generateMonsterAI, rerollMonsterAI } from "@/lib/generateMonster";
import { buildSummary } from "@/lib/buildSummary";
import { clearRecords, computeStreak, getRecords, saveBattle } from "@/lib/history";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import VentInput from "@/components/VentInput";
import CharacterReveal from "@/components/CharacterReveal";
import VentArena from "@/components/VentArena";
import Cooldown from "@/components/Cooldown";
import ReleaseSummary from "@/components/ReleaseSummary";
import HistoryGallery, { GalleryTab } from "@/components/HistoryGallery";

const EXIT_ANIMATION = { opacity: 0, x: -50 };

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [userInput, setUserInput] = useState("");
  const [monster, setMonster] = useState<MonsterData | null>(null);
  const [summary, setSummary] = useState<ReleaseSummaryData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [imageError, setImageError] = useState("");
  const [stressBefore, setStressBefore] = useState(60);
  const [stressAfter, setStressAfter] = useState(60);
  const [galleryTab, setGalleryTab] = useState<GalleryTab | null>(null);
  const [records, setRecords] = useState<BattleRecord[]>([]);

  // Load persisted history on mount (client only).
  useEffect(() => {
    setRecords(getRecords());
  }, []);

  const streak = useMemo(() => computeStreak(records), [records]);

  const handleVent = async (text: string, stress: number) => {
    if (generating) return;
    setUserInput(text);
    setStressBefore(stress);
    setGenerating(true);
    setGenerationError("");
    setImageError("");
    try {
      const monsterResult = await generateMonsterAI(text);

      try {
        const image = await generateCharacterImage(text);
        setMonster({ ...monsterResult, image });
      } catch {
        setMonster(monsterResult);
        setImageError("Portrait generator missed this round, so we loaded the classic emoji enemy.");
      }

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
    setImageError("");
    try {
      const m = await rerollMonsterAI(userInput, monster);
      try {
        const image = await generateCharacterImage(`${userInput}. Enemy concept: ${m.name}, ${m.archetype}, ${m.appearance}`);
        setMonster({ ...m, image });
      } catch {
        setMonster(m);
        setImageError("Portrait generator missed this reroll, so we kept the emoji fallback.");
      }
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
    if (!monster) return;
    const data = buildSummary(monster, hitCount, bestCombo, totalDamage, maxSingleHit, rageActivations);
    data.sceneId = sceneId;
    data.toolId = toolId;
    setSummary(data);

    if (hitCount > 0) {
      // Wind down before celebrating — convert catharsis into calm.
      setScreen("cooldown");
    } else {
      // Nothing to recover from; skip the breathing step.
      setStressAfter(stressBefore);
      setRecords(saveBattle(monster, data, stressBefore, stressBefore));
      setScreen("summary");
    }
  };

  const handleCooldownDone = (after: number) => {
    setStressAfter(after);
    if (monster && summary) {
      setRecords(saveBattle(monster, summary, stressBefore, after));
    }
    setScreen("summary");
  };

  const handleRematch = (target: MonsterData) => {
    setGalleryTab(null);
    setMonster(target);
    setUserInput(target.name);
    setSummary(null);
    setGenerationError("");
    setImageError("");
    setStressBefore(60);
    setStressAfter(60);
    setScreen("arena");
  };

  const handleClearHistory = () => {
    clearRecords();
    setRecords([]);
  };

  const handleRestart = () => {
    setUserInput("");
    setMonster(null);
    setSummary(null);
    setGenerationError("");
    setImageError("");
    setScreen("input");
  };

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#FFE4F3_0,#FAF5FF_34%,#E0F2FE_100%)] text-gray-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col relative overflow-hidden">
        <div className="pointer-events-none absolute -top-28 -right-20 h-72 w-72 rounded-full bg-brand-yellow/30 blur-3xl" />
        <div className="pointer-events-none absolute top-44 -left-24 h-72 w-72 rounded-full bg-brand-pink/20 blur-3xl" />
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-pink via-brand-yellow to-brand-cyan z-50" />
        <AppHeader streak={streak} />

        <main className="relative z-10 flex-1 flex items-start justify-center px-3 pt-2 pb-28 overflow-y-auto md:items-center md:px-6 md:pt-6">
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
                  imageError={imageError}
                />
              </motion.div>
            )}
            {screen === "arena" && monster && (
              <motion.div key="arena" exit={EXIT_ANIMATION} className="w-full">
                <VentArena monster={monster} onFinish={handleFinish} />
              </motion.div>
            )}
            {screen === "cooldown" && (
              <motion.div key="cooldown" exit={EXIT_ANIMATION} className="w-full">
                <Cooldown stressBefore={stressBefore} onComplete={handleCooldownDone} />
              </motion.div>
            )}
            {screen === "summary" && summary && (
              <motion.div key="summary" exit={EXIT_ANIMATION} className="w-full">
                <ReleaseSummary
                  data={summary}
                  onRestart={handleRestart}
                  stressBefore={stressBefore}
                  stressAfter={stressAfter}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav screen={screen} onOpenGallery={setGalleryTab} />
      </div>

      <AnimatePresence>
        {galleryTab && (
          <HistoryGallery
            initialTab={galleryTab}
            records={records}
            onClose={() => setGalleryTab(null)}
            onClear={handleClearHistory}
            onRematch={handleRematch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
