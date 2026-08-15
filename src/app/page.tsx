"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MonsterData, ReleaseSummaryData, Screen } from "@/lib/types";
import { GenerationError, generateCharacterImage, generateMonsterAI, rerollMonsterAI } from "@/lib/generateMonster";
import { buildSummary } from "@/lib/buildSummary";
import { LocalProgress, readLocalProgress, recordLocalRelease } from "@/lib/localProgress";
import { DailyBoss, buildSafeChallengeUrl, getDailyBoss, getNextDailyBoss, readSafeChallenge } from "@/lib/dailyBoss";
import {
  CollectionSnapshot,
  UnlockStatus,
  createEmptyCollectionSnapshot,
  getNewUnlocks,
  getNextUnlock,
  readCollection,
  recordEncounter,
} from "@/lib/localCollection";
import {
  LocalAnalyticsSnapshot,
  createEmptyLocalAnalyticsSnapshot,
  readLocalAnalytics,
  trackLocalEvent,
} from "@/lib/localAnalytics";
import { sanitizeInput } from "@/lib/safety";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import VentInput from "@/components/VentInput";
import CharacterReveal from "@/components/CharacterReveal";
import VentArena from "@/components/VentArena";
import ReleaseSummary from "@/components/ReleaseSummary";

const EXIT_ANIMATION = { opacity: 0, x: -24 };

function buildImageDescription(monster: MonsterData) {
  return [
    `Fictional stress monster: ${monster.name}, a ${monster.archetype}.`,
    `Visual concept: ${monster.appearance}`,
    `Symbolic bad habit: ${monster.toxicSkill}.`,
    `Comedic weakness: ${monster.weakness}.`,
    `Context only: ${monster.vibe}.`,
  ].join(" ").slice(0, 600);
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [userInput, setUserInput] = useState("");
  const [monster, setMonster] = useState<MonsterData | null>(null);
  const [summary, setSummary] = useState<ReleaseSummaryData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [imageGenerating, setImageGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [imageError, setImageError] = useState("");
  const [rerollsLeft, setRerollsLeft] = useState(1);
  const [progress, setProgress] = useState<LocalProgress | null>(null);
  const [dailyBoss, setDailyBoss] = useState<DailyBoss>(() => getDailyBoss(new Date("2026-01-01T00:00:00.000Z")));
  const [tomorrowBoss, setTomorrowBoss] = useState<DailyBoss>(() => getNextDailyBoss(new Date("2026-01-01T00:00:00.000Z")));
  const [challengeBoss, setChallengeBoss] = useState<DailyBoss | null>(null);
  const [activePublicBoss, setActivePublicBoss] = useState<DailyBoss | null>(null);
  const [collection, setCollection] = useState<CollectionSnapshot>(createEmptyCollectionSnapshot);
  const [analytics, setAnalytics] = useState<LocalAnalyticsSnapshot>(createEmptyLocalAnalyticsSnapshot);
  const [newUnlocks, setNewUnlocks] = useState<UnlockStatus[]>([]);
  const generationIdRef = useRef(0);
  const openedRef = useRef(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setProgress(readLocalProgress());
    setDailyBoss(getDailyBoss());
    setTomorrowBoss(getNextDailyBoss());
    setCollection(readCollection());
    setAnalytics(readLocalAnalytics());
    setChallengeBoss(readSafeChallenge(window.location.search));
    if (!openedRef.current) {
      openedRef.current = true;
      setAnalytics(trackLocalEvent("app_opened"));
    }
  }, []);

  useEffect(() => {
    if (screen === "input") return;
    const frame = requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [screen]);

  const generatePortrait = async (candidate: MonsterData, generationId: number) => {
    setImageGenerating(true);
    setImageError("");
    try {
      const image = await generateCharacterImage(buildImageDescription(candidate));
      if (generationIdRef.current !== generationId) return;
      setMonster((current) =>
        current?.name === candidate.name ? { ...current, image } : current,
      );
    } catch {
      if (generationIdRef.current !== generationId) return;
      setImageError("The custom portrait missed this round. The house mascot is filling in.");
    } finally {
      if (generationIdRef.current === generationId) setImageGenerating(false);
    }
  };

  const handleVent = async (text: string) => {
    if (generating) return;
    const safeInput = sanitizeInput(text);
    if (!safeInput || safeInput.isSensitive) {
      setGenerationError("Edit the vent into a safe, non-identifying description of the situation.");
      return;
    }

    const generationId = ++generationIdRef.current;
    setUserInput(safeInput.cleaned);
    setActivePublicBoss(null);
    setAnalytics(trackLocalEvent("generation_started"));
    setGenerating(true);
    setGenerationError("");
    setImageError("");
    setRerollsLeft(1);
    try {
      const monsterResult = await generateMonsterAI(safeInput.cleaned);
      if (generationIdRef.current !== generationId) return;

      // Activation comes first: reveal the playable boss immediately, then paint it in the background.
      setMonster(monsterResult);
      setAnalytics(trackLocalEvent("monster_revealed"));
      setScreen("reveal");
      setGenerating(false);
      void generatePortrait(monsterResult, generationId);
    } catch (error) {
      if (generationIdRef.current !== generationId) return;
      if (error instanceof GenerationError && error.kind === "safety") {
        setGenerationError("Edit the vent into a safe, non-identifying description of the situation.");
        return;
      }
      if (error instanceof GenerationError && error.kind === "rate_limit") {
        setGenerationError(error.message);
        return;
      }
      const variants = [
        "The cartoon portal jammed. Give it one more tap.",
        "The boss escaped under the sofa. Try summoning again.",
        "The chaos department dropped the paperwork. Try again.",
      ];
      setGenerationError(variants[Math.floor(Math.random() * variants.length)]);
    } finally {
      if (generationIdRef.current === generationId) setGenerating(false);
    }
  };

  const handleQuickVent = (text: string) => {
    setAnalytics(trackLocalEvent("quick_context_selected"));
    void handleVent(text);
  };

  const handlePublicBoss = (boss: DailyBoss) => {
    generationIdRef.current += 1;
    setUserInput("");
    setMonster({ ...boss.monster });
    setSummary(null);
    setActivePublicBoss(boss);
    setGenerating(false);
    setImageGenerating(false);
    setImageError("");
    setRerollsLeft(0);
    setScreen("reveal");
    setAnalytics(trackLocalEvent(challengeBoss?.id === boss.id ? "challenge_opened" : "daily_boss_opened"));
  };

  const handleStartArena = () => {
    setAnalytics(trackLocalEvent("battle_started"));
    setScreen("arena");
  };

  const handleGameEvent = (event: "first_attack" | "phase_two_reached" | "rage_activated" | "boss_defeated") => {
    setAnalytics(trackLocalEvent(event));
  };

  const handleReroll = async () => {
    if (!monster || generating || rerollsLeft <= 0) return;
    const generationId = ++generationIdRef.current;
    setGenerating(true);
    setImageGenerating(false);
    setImageError("");
    try {
      const nextMonster = await rerollMonsterAI(userInput, monster);
      if (generationIdRef.current !== generationId) return;
      setMonster(nextMonster);
      setRerollsLeft((count) => Math.max(0, count - 1));
      setGenerating(false);
      void generatePortrait(nextMonster, generationId);
    } catch (error) {
      if (generationIdRef.current !== generationId) return;
      if (error instanceof GenerationError && error.kind === "safety") {
        setImageError("That re-roll crossed the safety boundary. Your current boss is still ready.");
        return;
      }
      if (error instanceof GenerationError && error.kind === "rate_limit") {
        setImageError(error.message);
        return;
      }
      setImageError("The re-roll bounced. Your current boss is still ready.");
    } finally {
      if (generationIdRef.current === generationId) setGenerating(false);
    }
  };

  const handleFinish = (
    hitCount: number,
    bestCombo: number,
    sceneId: string,
    toolId: string,
    totalDamage: number,
    maxSingleHit: number,
    rageActivations: number,
    remainingHP: number,
    elapsedSeconds: number,
  ) => {
    if (!monster) return;
    const data = buildSummary(
      monster,
      hitCount,
      bestCombo,
      totalDamage,
      maxSingleHit,
      rageActivations,
      remainingHP,
      elapsedSeconds,
    );
    data.sceneId = sceneId;
    data.toolId = toolId;
    setSummary(data);
    setProgress(recordLocalRelease(data.outcome));
    const before = readCollection();
    const after = recordEncounter({
      monster,
      outcome: data.outcome,
      bestCombo,
      bestTimeMs: data.outcome === "defeated" ? elapsedSeconds * 1_000 : undefined,
    });
    const earned = getNewUnlocks(before, after);
    setCollection(after);
    setNewUnlocks(earned);
    if (earned.length > 0) {
      earned.forEach(() => trackLocalEvent("unlock_earned"));
    }
    if (data.outcome !== "defeated") {
      setAnalytics(trackLocalEvent("round_released"));
    }
    setAnalytics(trackLocalEvent("summary_viewed"));
    setScreen("summary");
  };

  const handleRestart = () => {
    generationIdRef.current += 1;
    setUserInput("");
    setMonster(null);
    setSummary(null);
    setGenerating(false);
    setImageGenerating(false);
    setGenerationError("");
    setImageError("");
    setRerollsLeft(1);
    setActivePublicBoss(null);
    setNewUnlocks([]);
    setScreen("input");
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", window.location.pathname);
      setChallengeBoss(null);
    }
  };

  const handleReplaySameMonster = () => {
    if (!monster) return;
    setSummary(null);
    setAnalytics(trackLocalEvent("replay_started"));
    setScreen("arena");
  };

  const handleOpenCollection = () => {
    setAnalytics(trackLocalEvent("collection_opened"));
  };

  const handleSummaryShareEvent = (event: "share_started" | "share_completed" | "mood_better" | "mood_same" | "mood_worse") => {
    setAnalytics(trackLocalEvent(event));
  };

  const unlockedIds = collection.unlocks.filter(({ unlocked }) => unlocked).map(({ id }) => id);
  const challengeUrl = activePublicBoss && typeof window !== "undefined"
    ? buildSafeChallengeUrl(
        window.location.origin,
        activePublicBoss.id,
        summary?.outcome === "defeated" ? summary.elapsedSeconds : null,
      )
    : null;

  return (
    <div className="min-h-dvh text-brand-ink">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col overflow-hidden">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-brand-pink/25 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 top-40 h-64 w-64 rounded-full bg-brand-cyan/20 blur-3xl" />
        <div className="absolute inset-x-0 top-0 z-50 h-2.5 bg-[repeating-linear-gradient(90deg,#17140f_0_18px,#ffe14a_18px_36px,#ff2d7b_36px_54px,#00d6c4_54px_72px)]" />
        <AppHeader screen={screen} />

        <main
          ref={mainRef}
          tabIndex={-1}
          className={`relative z-10 flex flex-1 items-start justify-center overflow-y-auto px-3 pb-28 outline-none md:px-6 ${
            screen === "arena" ? "pt-0 md:pt-1" : "pt-2 md:pt-4"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {screen === "input" && (
              <motion.div key="input" exit={EXIT_ANIMATION} className="w-full">
                <VentInput
                  onSubmit={handleVent}
                  onQuickSubmit={handleQuickVent}
                  loading={generating}
                  error={generationError}
                  progress={progress}
                  dailyBoss={dailyBoss}
                  challengeBoss={challengeBoss}
                  collection={collection}
                  analytics={analytics}
                  onPlayPublicBoss={handlePublicBoss}
                  onOpenCollection={handleOpenCollection}
                  onInputStarted={() => setAnalytics(trackLocalEvent("input_started"))}
                />
              </motion.div>
            )}
            {screen === "reveal" && monster && (
              <motion.div key="reveal" exit={EXIT_ANIMATION} className="w-full">
                <CharacterReveal
                  monster={monster}
                  onReady={handleStartArena}
                  onReroll={handleReroll}
                  loading={generating}
                  imageLoading={imageGenerating}
                  imageError={imageError}
                  rerollsLeft={rerollsLeft}
                  publicBoss={Boolean(activePublicBoss)}
                />
              </motion.div>
            )}
            {screen === "arena" && monster && (
              <motion.div key="arena" exit={EXIT_ANIMATION} className="w-full">
                <VentArena
                  monster={monster}
                  unlockedIds={unlockedIds}
                  onGameEvent={handleGameEvent}
                  onFinish={handleFinish}
                />
              </motion.div>
            )}
            {screen === "summary" && summary && (
              <motion.div key="summary" exit={EXIT_ANIMATION} className="w-full">
                <ReleaseSummary
                  data={summary}
                  onRestart={handleRestart}
                  onReplaySameMonster={handleReplaySameMonster}
                  challengeUrl={challengeUrl}
                  newUnlocks={newUnlocks}
                  nextUnlock={getNextUnlock(collection)}
                  tomorrowBossName={tomorrowBoss.monster.name}
                  onShareEvent={handleSummaryShareEvent}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <BottomNav screen={screen} onRestart={handleRestart} />
      </div>
    </div>
  );
}
