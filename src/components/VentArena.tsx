"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useReducedMotion,
} from "framer-motion";
import { MonsterData } from "@/lib/types";
import { SCENES, SceneConfig, getScene } from "@/lib/scenes";
import { TOOLS, ToolConfig, getTool } from "@/lib/tools";
import {
  ATTACK_COOLDOWN,
  ATTACKS,
  AttackId,
  COMBO_TIMEOUT,
  FALLBACK_REACTIONS,
  FLOAT_DURATION,
  FINISHERS,
  HIT_MESSAGES,
  HP_MAX,
  RAGE_DURATION,
  RAGE_MAX,
  VICTORY_MESSAGES,
} from "@/lib/battle";
import {
  BossIntent,
  INTENTS,
  applyNormalHitHp,
  attackIdToIntent,
  isFinisherReady,
  nextCombo,
  nextIntent,
  nextRage,
  resolveAttackDamage,
  shouldEnterPhaseTwo,
} from "@/lib/arenaEngine";
import { useTTS } from "@/hooks/useTTS";
import { VoiceToggle } from "@/components/VoiceToggle";

const ARENA_SECONDS = 30;

interface VentArenaProps {
  monster: MonsterData;
  unlockedIds?: string[];
  onGameEvent?: (event: "first_attack" | "phase_two_reached" | "rage_activated" | "boss_defeated") => void;
  onFinish: (
    hitCount: number,
    bestCombo: number,
    sceneId: string,
    toolId: string,
    totalDamage: number,
    maxSingleHit: number,
    rageActivations: number,
    remainingHP: number,
    elapsedSeconds: number,
  ) => void;
}

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  big?: boolean;
  speech?: boolean;
}

interface SceneParticle {
  id: number;
  emoji: string;
  x: number;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotate: number;
  emoji: string;
}

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buzz(pattern: number | number[]) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Haptics are a progressive enhancement.
  }
}

export default function VentArena({ monster, unlockedIds, onGameEvent, onFinish }: VentArenaProps) {
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [monsterHP, setMonsterHP] = useState(HP_MAX);
  const [rage, setRage] = useState(0);
  const [isRaging, setIsRaging] = useState(false);
  const [victoryPhase, setVictoryPhase] = useState<0 | 1 | 2>(0);
  const [victoryMessage, setVictoryMessage] = useState("");
  const [koText, setKoText] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [timeLeft, setTimeLeft] = useState(ARENA_SECONDS);
  const [timerStarted, setTimerStarted] = useState(false);
  const [timerExpired, setTimerExpired] = useState(false);
  const [bossPhase, setBossPhase] = useState<1 | 2>(1);
  const [bossIntent, setBossIntent] = useState<BossIntent>("wobble");
  const [phaseFlash, setPhaseFlash] = useState(false);
  const [finisherActive, setFinisherActive] = useState(false);
  const [sceneId, setSceneId] = useState("office");
  const [toolId, setToolId] = useState("slipper");
  const [tauntIndex, setTauntIndex] = useState(0);
  const [hitAnimation, setHitAnimation] = useState<AttackId | null>(null);
  const [combatMessage, setCombatMessage] = useState("Tap the boss or choose a move. Stop whenever you feel done.");
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [particles, setParticles] = useState<SceneParticle[]>([]);
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);

  const bestComboRef = useRef(0);
  const hitCountRef = useRef(0);
  const totalDamageRef = useRef(0);
  const maxSingleHitRef = useRef(0);
  const rageCountRef = useRef(0);
  const monsterHPRef = useRef(HP_MAX);
  const isRagingRef = useRef(false);
  const reactionIndexRef = useRef(0);
  const lastAttackRef = useRef(0);
  const floatIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const comboTimerRef = useRef<number | null>(null);
  const rageTimerRef = useRef<number | null>(null);
  const claimingRef = useRef(false);
  const victoryPhaseRef = useRef<0 | 1 | 2>(0);
  const timeoutIdsRef = useRef<Set<number>>(new Set());
  const elapsedSecondsRef = useRef(0);
  const timerStartedAtRef = useRef<number | null>(null);
  const timerStartedRef = useRef(false);
  const bossPhaseRef = useRef<1 | 2>(1);
  const bossIntentRef = useRef<BossIntent>("wobble");

  const arenaControls = useAnimationControls();
  const reduceMotion = useReducedMotion();
  const { speak, stop, isSupported, voiceEnabled, setVoiceEnabled } = useTTS();
  const scene: SceneConfig = getScene(sceneId);
  const tool: ToolConfig = getTool(toolId);
  const taunts = monster.taunts ?? [];
  const activeTaunt = taunts.length > 0 ? taunts[tauntIndex % taunts.length] : "Your peace was not in scope.";
  const isOver = victoryPhase > 0;
  const unlockedSet = new Set(unlockedIds ?? [
    ...SCENES.map(({ id }) => id),
    ...TOOLS.map(({ id }) => id),
    ...FINISHERS.map(({ id }) => id),
  ]);
  const availableFinishers = FINISHERS.filter(({ id }) => unlockedSet.has(id));
  const finisher = availableFinishers[availableFinishers.length - 1] ?? FINISHERS[0];
  const finisherReady = isFinisherReady(bossPhase, rage, monsterHP);

  const schedule = useCallback((callback: () => void, delay: number) => {
    const timeoutId = window.setTimeout(() => {
      timeoutIdsRef.current.delete(timeoutId);
      callback();
    }, delay);
    timeoutIdsRef.current.add(timeoutId);
    return timeoutId;
  }, []);

  const spawnFloat = useCallback((
    text: string,
    color: string,
    big = false,
    speech = false,
  ) => {
    const id = ++floatIdRef.current;
    setFloats((current) => [
      ...current.slice(-5),
      {
        id,
        text,
        color,
        big,
        speech,
        x: speech ? -12 + Math.random() * 24 : -36 + Math.random() * 72,
        y: speech ? 8 + Math.random() * 14 : -14 + Math.random() * 28,
      },
    ]);
    schedule(
      () => setFloats((current) => current.filter((item) => item.id !== id)),
      speech ? FLOAT_DURATION + 650 : FLOAT_DURATION,
    );
  }, [schedule]);

  const spawnParticle = useCallback((currentScene: SceneConfig) => {
    const id = ++particleIdRef.current;
    setParticles((current) => [
      ...current.slice(-4),
      { id, emoji: pickRandom(currentScene.particles), x: 12 + Math.random() * 76 },
    ]);
    schedule(
      () => setParticles((current) => current.filter((particle) => particle.id !== id)),
      1_050,
    );
  }, [schedule]);

  const finishBattle = useCallback(() => {
    if (claimingRef.current) return;
    claimingRef.current = true;
    setClaiming(true);
    stop();
    onFinish(
      hitCountRef.current,
      bestComboRef.current,
      sceneId,
      toolId,
      totalDamageRef.current,
      maxSingleHitRef.current,
      rageCountRef.current,
      monsterHPRef.current,
      elapsedSecondsRef.current,
    );
  }, [onFinish, sceneId, stop, toolId]);

  const activateRage = useCallback(() => {
    if (isRagingRef.current || rage < RAGE_MAX || isOver || timerExpired) return;
    isRagingRef.current = true;
    setIsRaging(true);
    rageCountRef.current += 1;
    onGameEvent?.("rage_activated");
    buzz([18, 30, 18]);
    spawnFloat("RAGE = BOUNDARIES!", "#FF4500", true);

    if (rageTimerRef.current) window.clearTimeout(rageTimerRef.current);
    rageTimerRef.current = schedule(() => {
      isRagingRef.current = false;
      setIsRaging(false);
      setRage(0);
    }, RAGE_DURATION);
  }, [isOver, onGameEvent, rage, schedule, spawnFloat, timerExpired]);

  const triggerVictory = useCallback(() => {
    if (victoryPhaseRef.current !== 0) return;
    victoryPhaseRef.current = 1;
    stop();
    setVictoryPhase(1);
    setKoText(`${finisher.emoji} ${finisher.label}`);
    onGameEvent?.("boss_defeated");
    buzz([24, 40, 24, 50, 70]);

    if (!reduceMotion) {
      const icons = ["✦", "★", "●", "◆", "⚡"];
      setConfetti(Array.from({ length: 22 }, (_, index) => ({
        id: Date.now() + index,
        x: -120 + Math.random() * 240,
        y: 80 + Math.random() * 180,
        rotate: -180 + Math.random() * 360,
        emoji: pickRandom(icons),
      })));
      schedule(() => setConfetti([]), 1_700);
    }

    schedule(() => {
      victoryPhaseRef.current = 2;
      setVictoryMessage(monster.victoryMessage || pickRandom(VICTORY_MESSAGES)(monster.name));
      setVictoryPhase(2);
    }, reduceMotion ? 150 : 700);
  }, [finisher.emoji, finisher.label, monster.name, monster.victoryMessage, onGameEvent, reduceMotion, schedule, stop]);

  const activateFinisher = useCallback(() => {
    if (!finisherReady || finisherActive || isOver) return;
    setFinisherActive(true);
    stop();
    buzz([18, 28, 18, 36, 80]);
    schedule(() => {
      const damage = monsterHPRef.current;
      hitCountRef.current += 1;
      totalDamageRef.current += damage;
      maxSingleHitRef.current = Math.max(maxSingleHitRef.current, damage);
      setHits((count) => count + 1);
      monsterHPRef.current = 0;
      setMonsterHP(0);
      setCombatMessage(`${finisher.label} The bad vibe has no rebuttal.`);
      setFinisherActive(false);
      triggerVictory();
    }, reduceMotion ? 120 : 850);
  }, [finisher.label, finisherActive, finisherReady, isOver, reduceMotion, schedule, stop, triggerVictory]);

  const handleAttack = useCallback((attackId: AttackId) => {
    const now = Date.now();
    if (
      isOver ||
      timerExpired ||
      victoryPhaseRef.current !== 0 ||
      monsterHPRef.current <= 0 ||
      now - lastAttackRef.current < ATTACK_COOLDOWN
    ) return;
    lastAttackRef.current = now;

    if (!timerStartedRef.current) {
      timerStartedRef.current = true;
      timerStartedAtRef.current = Date.now();
      setTimerStarted(true);
      onGameEvent?.("first_attack");
    }

    const attack = ATTACKS.find((candidate) => candidate.id === attackId);
    if (!attack) return;
    const isCounter = bossIntentRef.current === attackIdToIntent(attackId);
    const appliedDamage = resolveAttackDamage({
      attackId,
      isCounter,
      bossPhase: bossPhaseRef.current,
      isRaging: isRagingRef.current,
      remainingHp: monsterHPRef.current,
      roll: randomInt,
    });

    if (attackId === "slap") buzz(8);
    if (attackId === "punch") buzz([14, 22, 14]);
    if (attackId === "roast") buzz([6, 8, 6]);

    if (!reduceMotion) {
      const strength = (attackId === "punch" ? 10 : attackId === "slap" ? 6 : 3) * (isRagingRef.current ? 1.35 : 1);
      void arenaControls.start({
        x: [0, -strength, strength, -strength * 0.5, 0],
        transition: { duration: 0.24, ease: "easeOut" },
      });
    }

    hitCountRef.current += 1;
    totalDamageRef.current += appliedDamage;
    maxSingleHitRef.current = Math.max(maxSingleHitRef.current, appliedDamage);
    setHits((count) => count + 1);
    setCombatMessage(isCounter
      ? `Perfect counter! ${pickRandom(HIT_MESSAGES)(monster.name, appliedDamage)}`
      : `${INTENTS[bossIntentRef.current].label} blocked most of it. Follow the cue.`);

    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    setCombo((current) => {
      const next = nextCombo(current, isCounter, attackId);
      bestComboRef.current = Math.max(bestComboRef.current, next);
      return next;
    });
    comboTimerRef.current = schedule(() => setCombo(0), COMBO_TIMEOUT);

    setHitAnimation(attackId);
    schedule(() => setHitAnimation(null), attack.squashDuration + 50);

    const useToolCopy = hitCountRef.current % 4 === 0;
    const useSceneCopy = hitCountRef.current % 3 === 0;
    const copy = !isCounter
      ? "WRONG READ!"
      : useToolCopy
      ? pickRandom(tool.hitTexts)
      : useSceneCopy
        ? pickRandom(scene.hitTexts)
        : pickRandom(attack.texts);
    const color = !isCounter ? "#374151" : useToolCopy ? tool.color : attack.floatColor;
    spawnFloat(copy, color, attackId === "punch");
    if (hitCountRef.current % 2 === 0 && !reduceMotion) spawnParticle(scene);

    if (hitCountRef.current % 3 === 0) {
      const reactions = monster.reactions?.length ? monster.reactions : FALLBACK_REACTIONS;
      const reaction = reactions[reactionIndexRef.current % reactions.length];
      reactionIndexRef.current += 1;
      schedule(() => {
        spawnFloat(reaction, "#1F2937", false, true);
        speak(reaction, monsterHPRef.current / HP_MAX < 0.3 ? "angry" : "sarcastic");
      }, 150);
    }

    if (taunts.length > 0) setTauntIndex((index) => (index + 1) % taunts.length);
    if (!isRagingRef.current) {
      setRage((current) => {
        const next = nextRage(current, attack.rageFill, isCounter, false);
        if (current < RAGE_MAX && next >= RAGE_MAX) spawnFloat("RAGE READY!", "#FF4500", true);
        return next;
      });
    }

    const { rawNextHP, nextHP } = applyNormalHitHp(monsterHPRef.current, appliedDamage);
    monsterHPRef.current = nextHP;
    setMonsterHP(nextHP);
    if (shouldEnterPhaseTwo(nextHP, bossPhaseRef.current)) {
      bossPhaseRef.current = 2;
      setBossPhase(2);
      setPhaseFlash(true);
      onGameEvent?.("phase_two_reached");
      spawnFloat("PHASE 2 · EXCUSE OVERDRIVE", "#4C1D95", true);
      schedule(() => setPhaseFlash(false), reduceMotion ? 180 : 1_050);
    }
    const nextBossIntent = nextIntent(bossIntentRef.current, pickRandom);
    bossIntentRef.current = nextBossIntent;
    setBossIntent(nextBossIntent);
    if (rawNextHP === 0) {
      setRage(RAGE_MAX);
      spawnFloat("FINISHER READY!", "#111827", true);
    }
  }, [
    arenaControls,
    isOver,
    timerExpired,
    monster.name,
    monster.reactions,
    onGameEvent,
    reduceMotion,
    scene,
    schedule,
    spawnFloat,
    spawnParticle,
    speak,
    taunts.length,
    tool,
  ]);

  const handleTap = useCallback(() => {
    handleAttack(INTENTS[bossIntentRef.current].counter);
  }, [handleAttack]);

  useEffect(() => {
    if (!timerStarted || victoryPhase !== 0) return;
    const interval = window.setInterval(() => {
      const startedAt = timerStartedAtRef.current;
      if (startedAt === null) return;
      elapsedSecondsRef.current = Math.floor((Date.now() - startedAt) / 1_000);
      const next = Math.max(0, ARENA_SECONDS - elapsedSecondsRef.current);
      setTimeLeft(next);
      if (next === 0) {
        window.clearInterval(interval);
        setTimerExpired(true);
        setCombatMessage("Time’s up. Take your result or finish the boss on your terms.");
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [timerStarted, victoryPhase]);

  useEffect(() => () => {
    if (comboTimerRef.current) window.clearTimeout(comboTimerRef.current);
    if (rageTimerRef.current) window.clearTimeout(rageTimerRef.current);
    timeoutIdsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    timeoutIdsRef.current.clear();
    stop();
  }, [stop]);

  const hpPercent = (monsterHP / HP_MAX) * 100;
  const ragePercent = (rage / RAGE_MAX) * 100;
  const hpColor = hpPercent > 50 ? "#22C55E" : hpPercent > 20 ? "#F59E0B" : "#EF4444";
  const portrait = monster.image || "/stress-goblin.webp";
  const monsterAnimation = reduceMotion
    ? { opacity: victoryPhase === 1 ? 0.2 : 1 }
    : victoryPhase === 1
      ? { rotate: 18, scale: 0.45, opacity: 0 }
      : hitAnimation === "slap"
        ? { rotate: 5, scaleX: 1.12, scaleY: 0.88, opacity: 1 }
        : hitAnimation === "punch"
          ? { rotate: -8, scaleX: 1.25, scaleY: 0.75, opacity: 1 }
          : hitAnimation === "roast"
            ? { rotate: 0, scale: 0.82, opacity: 1 }
            : { rotate: 0, scale: 1, scaleX: 1, scaleY: 1, opacity: 1 };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-2 px-1">
      <section className="w-full rounded-[1.5rem] bg-white/90 p-3 shadow-lg ring-1 ring-black/5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 text-left">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-purple">30-second private arena</p>
            <p className="truncate text-sm font-black text-gray-900">{monster.name} · {monster.archetype}</p>
          </div>
          <button
            type="button"
            onClick={finishBattle}
            disabled={claiming || victoryPhase === 1 || finisherActive}
            className="min-h-10 shrink-0 rounded-full bg-gray-100 px-4 text-xs font-black uppercase tracking-wide text-gray-700 ring-1 ring-black/5 disabled:opacity-40"
          >
            {timerExpired ? "Take result ✓" : hits === 0 ? "Name it & close" : "I’m good ✓"}
          </button>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-1 rounded-2xl bg-gray-100 p-1" aria-label="Choose arena scene">
          {SCENES.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setSceneId(candidate.id)}
              disabled={!unlockedSet.has(candidate.id)}
              aria-pressed={sceneId === candidate.id}
              aria-label={unlockedSet.has(candidate.id) ? candidate.label : `${candidate.label} locked`}
              className={`min-h-9 rounded-xl px-2 text-[10px] font-black uppercase tracking-wide transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
                sceneId === candidate.id ? "bg-brand-purple text-white shadow" : "text-gray-600"
              }`}
            >
              <span aria-hidden>{unlockedSet.has(candidate.id) ? candidate.emoji : "🔒"}</span> {candidate.label}
            </button>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto] items-center gap-3">
          <div className="space-y-1.5">
            <div>
              <div className="mb-0.5 flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
                <span>Boss ego</span><span>{monsterHP}/{HP_MAX}</span>
              </div>
              <div
                role="progressbar"
                aria-label="Boss ego remaining"
                aria-valuemin={0}
                aria-valuemax={HP_MAX}
                aria-valuenow={monsterHP}
                className="h-2 overflow-hidden rounded-full bg-gray-200"
              >
                <motion.div className="h-full rounded-full" animate={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
              </div>
            </div>
            <div>
              <div className="mb-0.5 flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-600">
                <span>Rage = boundary boost</span><span>{Math.round(ragePercent)}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Boundary boost charged"
                aria-valuemin={0}
                aria-valuemax={RAGE_MAX}
                aria-valuenow={rage}
                className="h-2 overflow-hidden rounded-full bg-gray-200"
              >
                <motion.div className="h-full rounded-full bg-gradient-to-r from-brand-pink to-orange-500" animate={{ width: `${ragePercent}%` }} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="rounded-xl bg-gray-50 px-2 py-1.5 text-center ring-1 ring-black/5" aria-live="polite">
              <p className="text-base font-black text-gray-900">{timeLeft}</p>
              <p className="text-[8px] font-black uppercase tracking-wider text-gray-500">{timerStarted ? "sec" : "on first hit"}</p>
            </div>
            <VoiceToggle
              supported={isSupported}
              enabled={voiceEnabled}
              onToggle={setVoiceEnabled}
            />
          </div>
        </div>
      </section>

      <motion.section
        animate={arenaControls}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-[1.75rem] ${scene.bgClass} ${
          bossPhase === 2
            ? "ring-4 ring-brand-pink/70 shadow-[0_0_0_2px_rgba(255,214,0,0.65),0_14px_36px_rgba(124,58,237,0.34)]"
            : ""
        }`}
        style={{ height: "clamp(210px, 31vh, 255px)" }}
        aria-label={`${scene.label} cartoon arena`}
      >
        <AnimatePresence>
          {bossPhase === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: reduceMotion ? 0.2 : [0.16, 0.28, 0.16] }}
              exit={{ opacity: 0 }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_52%,rgba(255,214,0,0.08),rgba(236,72,153,0.34)_62%,rgba(76,29,149,0.58))]"
              aria-hidden
            />
          )}
        </AnimatePresence>
        <div className="absolute left-3 top-3 z-20 flex gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-gray-700 shadow-sm">Hits {hits}</span>
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-gray-700 shadow-sm">Combo ×{combo}</span>
        </div>
        <div
          className="absolute inset-x-0 top-11 z-20 mx-auto w-fit rounded-full px-3 py-1 text-center text-[9px] font-black uppercase tracking-widest text-white shadow-lg"
          style={{ backgroundColor: INTENTS[bossIntent].color }}
          role="status"
          aria-live="polite"
        >
          {bossPhase === 2 ? "Phase 2 · " : ""}{INTENTS[bossIntent].label} · {INTENTS[bossIntent].cue}
        </div>
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1" aria-hidden>
          {bossPhase === 2 && (
            <span className="rounded-full bg-brand-purple-deep px-2 py-1 text-[8px] font-black uppercase tracking-widest text-brand-yellow shadow">
              Phase 2
            </span>
          )}
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-sm shadow">{tool.emoji}</span>
        </div>

        <AnimatePresence>
          {phaseFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.7, 1.08, 1, 1.25] }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0.1 : 1 }}
              className="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center bg-brand-purple-deep/95 px-6 text-center text-white"
            >
              <span className="text-4xl" aria-hidden>😤</span>
              <p className="font-display text-4xl tracking-wide text-brand-yellow">EXCUSE OVERDRIVE</p>
              <p className="mt-1 text-xs font-black uppercase tracking-widest">Read the cue. Counters now hit harder.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {finisherActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/95 text-center"
            >
              <motion.div
                initial={{ scale: reduceMotion ? 1 : 0.2, rotate: reduceMotion ? 0 : -12 }}
                animate={{ scale: reduceMotion ? 1 : [0.2, 1.35, 1], rotate: reduceMotion ? 0 : [-12, 8, 0] }}
                transition={{ duration: reduceMotion ? 0.01 : 0.7, ease: "easeOut" }}
              >
                <p className="text-6xl" aria-hidden>{finisher.emoji}</p>
                <p className="mt-2 font-display text-5xl tracking-wider text-brand-yellow">{finisher.label}</p>
                <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-white">Boundary delivered</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {particles.map((particle) => (
            <motion.span
              key={particle.id}
              initial={{ opacity: 1, y: 30, scale: 0.7 }}
              animate={{ opacity: 0, y: -80, scale: 1.1 }}
              transition={{ duration: 0.9 }}
              className="pointer-events-none absolute bottom-3 text-xl"
              style={{ left: `${particle.x}%` }}
              aria-hidden
            >
              {particle.emoji}
            </motion.span>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {floats.map((floating) => (
            <motion.div
              key={floating.id}
              initial={{ opacity: 0, y: 12, x: floating.x, scale: 0.75 }}
              animate={{ opacity: [0, 1, 1, 0], y: -58 + floating.y, x: floating.x, scale: floating.big ? 1.2 : 1 }}
              transition={{ duration: floating.speech ? 1.3 : 0.7, ease: "easeOut" }}
              className={`pointer-events-none absolute top-12 z-30 max-w-[190px] text-center font-black ${
                floating.speech
                  ? "rounded-2xl border-2 border-gray-900 bg-white px-3 py-2 text-[10px] italic text-gray-900 shadow-[3px_3px_0_#1F2937]"
                  : "rounded-lg px-3 py-1.5 text-xs text-white shadow-lg"
              }`}
              style={floating.speech ? undefined : { backgroundColor: floating.color }}
            >
              {floating.speech ? `“${floating.text}”` : floating.text}
            </motion.div>
          ))}
        </AnimatePresence>

        <motion.button
          type="button"
          onClick={handleTap}
          disabled={isOver || timerExpired}
          animate={monsterAnimation}
          transition={reduceMotion ? { duration: 0.01 } : { type: "spring", stiffness: 520, damping: 12 }}
          aria-label={`${INTENTS[bossIntent].cue} against fictional boss ${monster.name}`}
          className={`relative z-10 aspect-square w-[min(54%,190px)] overflow-hidden rounded-[1.5rem] bg-white shadow-2xl ring-4 disabled:cursor-default ${
            bossPhase === 2
              ? "ring-brand-yellow saturate-125 shadow-[0_0_32px_rgba(255,214,0,0.48)]"
              : "ring-white"
          }`}
        >
          <Image
            src={portrait}
            alt=""
            fill
            unoptimized={Boolean(monster.image)}
            sizes="190px"
            draggable={false}
            className="pointer-events-none object-cover"
          />
        </motion.button>

        <div className="absolute inset-x-3 bottom-3 z-20 text-center">
          <p className="inline-block rounded-full bg-white/90 px-3 py-1 text-[10px] font-black italic text-gray-700 shadow-sm">
            “{activeTaunt}”
          </p>
        </div>

        <AnimatePresence>
          {victoryPhase === 1 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1], scale: [0.8, 1.08, 1] }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-white/80"
            >
              <p className="font-display text-5xl tracking-widest text-brand-red">{koText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confetti.map((piece) => (
            <motion.span
              key={piece.id}
              initial={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, x: piece.x, y: piece.y, rotate: piece.rotate }}
              transition={{ duration: 1.3, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-1/3 z-50 text-xl text-brand-pink"
              aria-hidden
            >
              {piece.emoji}
            </motion.span>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {victoryPhase === 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-brand-purple-dark/95 px-6 text-center text-white"
            >
              <span className="text-4xl" aria-hidden>✨</span>
              <p className="font-display text-4xl tracking-wider text-brand-yellow">BOSS CLEARED</p>
              <p className="max-w-sm text-xs font-semibold leading-relaxed">{victoryMessage}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      <p
        aria-live="polite"
        className="min-h-10 w-full rounded-2xl bg-white/90 px-4 py-2 text-center text-xs font-black leading-snug text-brand-purple shadow-sm ring-1 ring-black/5"
      >
        {combatMessage}
      </p>

      <section className="w-full" aria-label="Choose a silly arena prop">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Prop</span>
          <span className="text-[10px] font-black uppercase tracking-wide text-brand-purple">{tool.emoji} {tool.label}</span>
        </div>
        <div className="mt-1 grid grid-cols-5 gap-1.5">
          {TOOLS.map((candidate) => {
            const unlocked = unlockedSet.has(candidate.id);
            return (
              <button
                key={candidate.id}
                type="button"
                onClick={() => setToolId(candidate.id)}
                disabled={!unlocked}
                aria-label={unlocked ? `${candidate.label}: ${candidate.feeling}` : `${candidate.label} locked`}
                aria-pressed={toolId === candidate.id}
                className={`min-h-11 rounded-xl text-xl transition-all ${
                  toolId === candidate.id
                    ? "border-2 border-brand-purple bg-white shadow"
                    : "border-2 border-transparent bg-white/65"
                } disabled:cursor-not-allowed disabled:opacity-35`}
              >
                <span aria-hidden>{unlocked ? candidate.emoji : "🔒"}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid w-full grid-cols-3 gap-2">
        {ATTACKS.map((attack) => (
          <motion.button
            key={attack.id}
            type="button"
            whileTap={{ scale: reduceMotion ? 1 : 0.92 }}
            onClick={() => handleAttack(attack.id)}
            disabled={isOver || timerExpired}
            className="flex min-h-16 flex-col items-center justify-center rounded-2xl px-2 py-2 text-[10px] font-black uppercase tracking-wide shadow-md disabled:opacity-45"
            style={{
              backgroundColor: isRaging ? "#FF4500" : attack.color,
              color: attack.color === "#FFD600" && !isRaging ? "#111827" : "#FFFFFF",
            }}
          >
            <span className="text-xl leading-none" aria-hidden>{attack.emoji}</span>
            <span className="mt-1">{attack.label}</span>
            <span className="text-[8px] opacity-75">{attack.detail}</span>
          </motion.button>
        ))}
      </div>

      {victoryPhase === 2 ? (
        <button
          type="button"
          onClick={finishBattle}
          disabled={claiming}
          className="min-h-12 w-full rounded-2xl bg-brand-yellow px-5 py-3 text-base font-black uppercase tracking-wide text-black shadow-[0_4px_0_rgba(0,0,0,0.12)] disabled:opacity-60"
        >
          Take the win →
        </button>
      ) : finisherReady ? (
        <motion.button
          type="button"
          whileTap={{ scale: reduceMotion ? 1 : 0.96 }}
          onClick={activateFinisher}
          disabled={finisherActive || isOver}
          className="min-h-14 w-full overflow-hidden rounded-2xl bg-black px-4 py-3 font-display text-2xl tracking-wider text-brand-yellow shadow-[0_5px_0_#7C3AED] disabled:opacity-50"
        >
          {finisher.emoji} FINISH IT · {finisher.label}
        </motion.button>
      ) : (
        <button
          type="button"
          onClick={activateRage}
          disabled={rage < RAGE_MAX || isRaging || isOver || timerExpired}
          className="min-h-11 w-full rounded-2xl border-2 border-orange-200 bg-orange-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-orange-700 transition-colors enabled:bg-orange-500 enabled:text-white disabled:opacity-55"
        >
          {isRaging
            ? "Boundary boost active · 2× arcade points"
            : rage >= RAGE_MAX
              ? "Activate boundary boost · 2× arcade points"
              : timerStarted
                ? "Read the cue to charge the finisher"
                : "Timer starts with your first attack"}
        </button>
      )}
    </div>
  );
}
