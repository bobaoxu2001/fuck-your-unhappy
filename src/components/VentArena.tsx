"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MonsterData } from "@/lib/types";
import { SCENES, SceneConfig, getScene } from "@/lib/scenes";
import { TOOLS, ToolConfig, getTool } from "@/lib/tools";

interface VentArenaProps {
  monster: MonsterData;
  onFinish: (hitCount: number, bestCombo: number, sceneId: string, toolId: string) => void;
}

// ─── Attack config ────────────────────────────────────────────────────────────
const ATTACKS = [
  {
    id: "slap" as const,
    label: "Slap",
    emoji: "👋",
    minDmg: 8,
    maxDmg: 16,
    color: "#FF6B6B",
    texts: ["SMACK!", "SLIPPER JUSTICE!", "WHAP!", "SLAP!", "THWACK!", "CHANCLA!"],
    comboText: "SLAP FRENZY!",
  },
  {
    id: "punch" as const,
    label: "Punch",
    emoji: "👊",
    minDmg: 13,
    maxDmg: 22,
    color: "#7C3AED",
    texts: ["BONK!", "CRUSH!", "POW!", "SMASH!", "OBLITERATE!", "KO!"],
    comboText: "PUNCH COMBO!",
  },
  {
    id: "roast" as const,
    label: "Roast",
    emoji: "🎤",
    minDmg: 15,
    maxDmg: 28,
    color: "#FFD600",
    texts: ["DESTROYED!", "EXPOSED!", "VERBAL NUKE!", "SERVED!", "RECEIPTS OUT!", "NO CHILL!"],
    comboText: "ROAST ROYALE!",
  },
] as const;

type AttackId = typeof ATTACKS[number]["id"];

// ─── Victory messages ─────────────────────────────────────────────────────────
const VICTORY_MESSAGES: ((name: string) => string)[] = [
  (n) => `${n} has been defeated by direct communication.`,
  (n) => `${n} has left the building. Forever.`,
  (n) => `${n} just got absolutely cooked. RIP.`,
  (n) => `${n} filed for emotional bankruptcy.`,
  (n) => `${n} has disconnected from reality.`,
];

// ─── Constants ────────────────────────────────────────────────────────────────
const COMBO_TIMEOUT_MS = 800;
const FLOAT_DURATION_MS = 700;

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
}

interface SceneParticle {
  id: number;
  emoji: string;
  x: number;
  delay: number;
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VentArena({ monster, onFinish }: VentArenaProps) {
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [floats, setFloats] = useState<FloatingText[]>([]);
  const [squash, setSquash] = useState(false);
  const [sceneId, setSceneId] = useState("office");
  const [toolId, setToolId] = useState("slipper");
  const [particles, setParticles] = useState<SceneParticle[]>([]);
  const [monsterHP, setMonsterHP] = useState(100);
  const [isDefeated, setIsDefeated] = useState(false);
  const [victoryMsg, setVictoryMsg] = useState("");
  const [tauntIndex, setTauntIndex] = useState(0);

  const bestComboRef = useRef(0);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const hitCountRef = useRef(0);

  const scene: SceneConfig = getScene(sceneId);
  const tool: ToolConfig = getTool(toolId);

  const taunts = monster.taunts ?? [];
  const activeTaunt = taunts.length > 0 ? taunts[tauntIndex % taunts.length] : null;

  // ── Defeat detection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (monsterHP <= 0 && !isDefeated) {
      setIsDefeated(true);
      setVictoryMsg(pickRandom(VICTORY_MESSAGES)(monster.name));
    }
  }, [monsterHP, isDefeated, monster.name]);

  // ── Spawn helpers ────────────────────────────────────────────────────────────
  const spawnParticle = useCallback((scn: SceneConfig) => {
    const id = ++particleIdRef.current;
    const emoji = pickRandom(scn.particles);
    const x = 10 + Math.random() * 80;
    const delay = Math.random() * 0.15;
    setParticles((prev) => [...prev.slice(-4), { id, emoji, x, delay }]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => p.id !== id)), 1200);
  }, []);

  const spawnFloat = useCallback((text: string, color: string) => {
    const id = ++floatIdRef.current;
    setFloats((prev) => [
      ...prev.slice(-5),
      { id, text, x: -40 + Math.random() * 80, y: -20 + Math.random() * 40, color },
    ]);
    setTimeout(() => setFloats((prev) => prev.filter((f) => f.id !== id)), FLOAT_DURATION_MS);
  }, []);

  // ── Core attack handler ──────────────────────────────────────────────────────
  const handleAttack = useCallback(
    (attackId: AttackId) => {
      if (isDefeated) return;

      const attack = ATTACKS.find((a) => a.id === attackId) ?? ATTACKS[0];
      const damage =
        Math.floor(Math.random() * (attack.maxDmg - attack.minDmg + 1)) + attack.minDmg;

      // Hits + combo
      setHits((h) => h + 1);
      hitCountRef.current += 1;
      setSquash(true);
      setTimeout(() => setSquash(false), 150);

      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      setCombo((c) => {
        const next = c + 1;
        if (next > bestComboRef.current) bestComboRef.current = next;
        const isComboHit = next > 1 && next % 3 === 0;
        spawnFloat(
          isComboHit ? attack.comboText : pickRandom(attack.texts),
          isComboHit ? "#FFD600" : attack.color,
        );
        return next;
      });
      comboTimerRef.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT_MS);

      // Scene particles every 2nd hit
      if (hitCountRef.current % 2 === 0) spawnParticle(getScene(sceneId));

      // Cycle taunts every hit
      if (taunts.length > 0) setTauntIndex((i) => (i + 1) % taunts.length);

      // Reduce HP
      setMonsterHP((hp) => Math.max(0, hp - damage));
    },
    [isDefeated, sceneId, taunts.length, spawnFloat, spawnParticle],
  );

  // Tap the monster = random attack
  const handleTap = useCallback(() => {
    handleAttack(pickRandom(ATTACKS).id);
  }, [handleAttack]);

  // Scene flavor text
  const [flavorText, setFlavorText] = useState(() => pickRandom(scene.flavorTexts));
  useEffect(() => {
    setFlavorText(pickRandom(scene.flavorTexts));
  }, [scene]);

  const flavorHit = hits > 0 && hits % 5 === 0;
  useEffect(() => {
    if (flavorHit) setFlavorText(pickRandom(scene.flavorTexts));
  }, [flavorHit, scene]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const hpColor =
    monsterHP > 60 ? "#22C55E" : monsterHP > 30 ? "#FFD600" : "#EF4444";

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-1.5 min-[380px]:gap-2 w-full max-w-sm mx-auto px-3">

      {/* ── SCENE TABS ─────────────────────────────────────────────────────── */}
      <div className="w-full flex items-center gap-1.5 bg-white/80 rounded-2xl p-1 shadow-sm border border-gray-100">
        {SCENES.map((s) => (
          <button
            key={s.id}
            onClick={() => setSceneId(s.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all duration-200 ${
              sceneId === s.id
                ? "bg-brand-purple text-white shadow-md"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <span className="text-sm">{s.emoji}</span>
            <span className="hidden min-[340px]:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ── MONSTER HP BAR ─────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">
            Monster HP
          </span>
          <span className="text-lg font-black" style={{ color: hpColor }}>
            {monsterHP}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            animate={{ width: `${monsterHP}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full"
            style={{ backgroundColor: hpColor }}
          />
        </div>
      </div>

      {/* ── HITS + COMBO ───────────────────────────────────────────────────── */}
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1 shadow-sm border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Hits</span>
            <span className="text-sm font-black text-brand-red">{hits}</span>
          </div>
          <div className="flex items-center gap-1 bg-white rounded-xl px-2.5 py-1 shadow-sm border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Combo</span>
            <span
              className="text-sm font-black"
              style={{ color: combo > 2 ? "#FFD600" : "#9CA3AF" }}
            >
              {combo}x
            </span>
          </div>
        </div>
        {combo >= 3 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="comic-sticker bg-brand-yellow text-black text-xs"
            style={{ ["--sticker-rotate" as string]: "-3deg" }}
          >
            x{combo} COMBO
          </motion.div>
        )}
      </div>

      {/* ── MONSTER TAP AREA ───────────────────────────────────────────────── */}
      <div
        className={`relative flex items-center justify-center w-full rounded-3xl transition-all duration-500 ${scene.bgClass}`}
        style={{ height: "clamp(120px, 25vh, 224px)" }}
      >
        {/* Scene particles */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: 0, scale: 0.6 }}
              animate={{ opacity: 0, y: -90, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.0, delay: p.delay, ease: "easeOut" }}
              className="absolute bottom-4 pointer-events-none select-none z-0 text-lg"
              style={{ left: `${p.x}%` }}
            >
              {p.emoji}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Floating hit text */}
        <AnimatePresence>
          {floats.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 0.5, x: f.x }}
              animate={{ opacity: 0, y: -80 + f.y, scale: 1.2, x: f.x }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute top-4 pointer-events-none select-none z-10"
            >
              <span
                className="comic-sticker text-white text-sm"
                style={{
                  backgroundColor: f.color,
                  color: f.color === "#FFD600" ? "#000" : "#fff",
                  ["--sticker-rotate" as string]: `${-6 + Math.random() * 12}deg`,
                }}
              >
                {f.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Monster */}
        <motion.button
          onClick={handleTap}
          animate={
            squash
              ? { scaleX: 1.2, scaleY: 0.8, rotate: Math.random() > 0.5 ? 6 : -6 }
              : { scaleX: 1, scaleY: 1, rotate: 0 }
          }
          transition={{ type: "spring", stiffness: 600, damping: 12 }}
          className="text-8xl select-none cursor-pointer active:scale-90 transition-none drop-shadow-lg z-10"
          disabled={isDefeated}
        >
          {monster.emoji}
        </motion.button>

        {/* Flavor text every 5th hit */}
        {flavorHit && !isDefeated && (
          <motion.div
            key={`flavor-${hits}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 left-2 right-2 text-center z-10"
          >
            <span className="font-display text-base text-brand-red tracking-wider inline-block bg-white/80 backdrop-blur-sm rounded-full px-4 py-1">
              {flavorText}
            </span>
          </motion.div>
        )}

        {/* Active tool indicator */}
        <AnimatePresence mode="wait">
          <motion.div
            key={toolId}
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 8 }}
            exit={{ scale: 0, rotate: 30 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
            className="absolute top-2 right-3 text-2xl pointer-events-none select-none z-10 drop-shadow-md"
          >
            {tool.emoji}
          </motion.div>
        </AnimatePresence>

        {/* ── VICTORY OVERLAY ───────────────────────────────────────────────── */}
        <AnimatePresence>
          {isDefeated && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/80 backdrop-blur-sm z-20 px-5 text-center gap-1.5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.1 }}
                className="text-4xl"
              >
                💀
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display text-2xl text-brand-yellow tracking-wider leading-tight"
              >
                DEFEATED!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 }}
                className="text-white text-[11px] leading-snug opacity-90 max-w-[190px]"
              >
                {victoryMsg}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MONSTER NAME + TAUNT ───────────────────────────────────────────── */}
      <div className="w-full text-center min-h-[32px]">
        <p className="text-sm font-black uppercase tracking-wider text-gray-400">
          {monster.name}
        </p>
        <AnimatePresence mode="wait">
          {activeTaunt && !isDefeated && (
            <motion.p
              key={activeTaunt}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="text-[11px] font-bold italic text-gray-500 mt-0.5 leading-tight"
            >
              &ldquo;{activeTaunt}&rdquo;
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── WEAPON SELECTOR ────────────────────────────────────────────────── */}
      <div className="w-full">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            Weapon
          </span>
          <AnimatePresence mode="wait">
            <motion.span
              key={toolId}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="text-[11px] font-black uppercase tracking-wide text-brand-purple"
            >
              {tool.emoji} {tool.label}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setToolId(t.id)}
              className={`flex items-center justify-center w-11 h-9 rounded-xl text-lg transition-all duration-200 border-2 shrink-0 ${
                toolId === t.id
                  ? "bg-white shadow-md border-brand-purple scale-110"
                  : "bg-white/60 border-transparent hover:border-gray-200"
              }`}
            >
              {t.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── ATTACK BUTTONS ─────────────────────────────────────────────────── */}
      <div className="w-full grid grid-cols-3 gap-2">
        {ATTACKS.map((attack) => (
          <motion.button
            key={attack.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleAttack(attack.id)}
            disabled={isDefeated}
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl font-black uppercase text-[11px] tracking-wide border-2 border-black/8 shadow-md disabled:opacity-40 transition-all active:shadow-inner"
            style={{
              backgroundColor: attack.color,
              color: attack.color === "#FFD600" ? "#000" : "#fff",
            }}
          >
            <span className="text-xl leading-none">{attack.emoji}</span>
            {attack.label}
          </motion.button>
        ))}
      </div>

      {/* ── CLAIM VICTORY / SKIP ───────────────────────────────────────────── */}
      {isDefeated ? (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onFinish(hits, bestComboRef.current, sceneId, toolId)}
          className="w-full py-2.5 rounded-2xl bg-brand-yellow text-black text-base font-black uppercase tracking-wide shadow-md border-2 border-black/5"
        >
          🏆 Claim Victory
        </motion.button>
      ) : (
        <button
          onClick={() => onFinish(hits, bestComboRef.current, sceneId, toolId)}
          className="text-[11px] font-bold text-gray-400 uppercase tracking-wide py-1"
        >
          {hits === 0 ? "Skip" : "I'm Done 😌"}
        </button>
      )}
    </div>
  );
}
