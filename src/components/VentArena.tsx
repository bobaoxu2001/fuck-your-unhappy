"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MonsterData } from "@/lib/types";
import { SCENES, SceneConfig, getScene } from "@/lib/scenes";
import { TOOLS, ToolConfig, getTool } from "@/lib/tools";
import { useTTS } from "@/hooks/useTTS";
import { VoiceToggle } from "@/components/VoiceToggle";

interface VentArenaProps {
  monster: MonsterData;
  onFinish: (
    hitCount: number,
    bestCombo: number,
    sceneId: string,
    toolId: string,
    totalDamage: number,
    maxSingleHit: number,
    rageActivations: number,
  ) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const HP_MAX         = 1000;
const RAGE_MAX       = 100;
const RAGE_DURATION  = 5000;   // ms rage mode lasts
const COMBO_TIMEOUT  = 1000;   // ms before combo resets
const FLOAT_DURATION = 700;    // ms floating text lives

// ─── Attack definitions ───────────────────────────────────────────────────────
// Each attack has distinct mechanics, not just different numbers.
const ATTACKS = [
  {
    id: "slap" as const,
    label: "Slap",
    emoji: "👋",
    // Fast, spammy, two quick floats per hit
    minDmg: 6,
    maxDmg: 12,
    rageFill: 8,
    color: "#FF6B6B",
    floatColor: "#FF6B6B",
    // Two pools — pick 2 at once for double-text feel
    texts: ["SMACK!", "WHAP!", "THWACK!", "SLIPPER!", "CHANCLA!", "SLAP!"],
    extraTexts: ["ow.", "hey!", "rude.", "again!", "ok ok", "!!!!"],
    comboText: "SLAP STORM!",
    // Monster squash: quick horizontal
    squashAnim: { scaleX: 1.18, scaleY: 0.82, rotate: 5 } as const,
    squashDuration: 120,
  },
  {
    id: "punch" as const,
    label: "Punch",
    emoji: "👊",
    // Slower, heavier, strong screen shake
    minDmg: 10,
    maxDmg: 18,
    rageFill: 13,
    color: "#7C3AED",
    floatColor: "#7C3AED",
    texts: ["BONK!", "CRUSH!", "POW!!", "SMASH!!", "OBLITERATE!", "K.O.!"],
    extraTexts: [],
    comboText: "MEGA PUNCH!",
    // Monster squash: heavy vertical crush
    squashAnim: { scaleX: 1.38, scaleY: 0.62, rotate: -10 } as const,
    squashDuration: 200,
  },
  {
    id: "roast" as const,
    label: "Roast",
    emoji: "🎤",
    // Monster reacts with fear/shrink — mental damage style
    minDmg: 12,
    maxDmg: 20,
    rageFill: 18,
    color: "#FFD600",
    floatColor: "#9333EA",
    texts: ["THERAPY BILL!", "PSYCHIC DAMAGE!", "CRINGE OVERLOAD!", "EMOTIONALLY WRECKED!", "RECEIPTS SUBMITTED!", "WORD NUKE!"],
    extraTexts: [],
    comboText: "ROAST ROYALE!",
    // Monster squash: fear shrink (distinct from physical hits)
    squashAnim: { scale: 0.72, rotate: 0 } as const,
    squashDuration: 350,
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
  (n) => `${n} called. You didn't pick up.`,
  (n) => `${n} has been reported to the karma department.`,
];

// ─── Knockout exclamations ────────────────────────────────────────────────────
const KO_TEXTS = ["💥 K.O.!!", "🏆 FINISHED!!", "☠️ DELETED!!", "💀 DESTROYED!!", "⚡ GAME OVER!!"];

// ─── Fallback reactions for older monsters without the field ──────────────────
const FALLBACK_REACTIONS = [
  "That's not what I said!",
  "You're too sensitive.",
  "I was only trying to help!",
  "Why is everyone attacking me?",
  "That's completely unfair.",
  "I'm literally the victim here.",
];

// ─── Floating text type ───────────────────────────────────────────────────────
interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  big?: boolean;
  speech?: boolean;  // speech bubble style — defensive reaction
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

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VentArena({ monster, onFinish }: VentArenaProps) {
  // ── Core battle state ────────────────────────────────────────────────────────
  const [hits, setHits]             = useState(0);
  const [combo, setCombo]           = useState(0);
  const [monsterHP, setMonsterHP]   = useState(HP_MAX);
  // 0 = fighting  1 = KO animation  2 = defeated overlay
  const [victoryPhase, setVictoryPhase] = useState<0 | 1 | 2>(0);
  const [victoryMsg, setVictoryMsg] = useState("");
  const [koText, setKoText]         = useState("");

  // ── Rage state ───────────────────────────────────────────────────────────────
  const [rage, setRage]             = useState(0);
  const [isRaging, setIsRaging]     = useState(false);

  // ── Visual state ─────────────────────────────────────────────────────────────
  const [floats, setFloats]         = useState<FloatingText[]>([]);
  const [particles, setParticles]   = useState<SceneParticle[]>([]);
  // which attack animation is playing on the monster
  const [hitAnim, setHitAnim]       = useState<AttackId | null>(null);
  const [sceneId, setSceneId]       = useState("office");
  const [toolId, setToolId]         = useState("slipper");
  const [tauntIndex, setTauntIndex] = useState(0);

  // ── Refs (mutable, no re-render) ─────────────────────────────────────────────
  const bestComboRef       = useRef(0);
  const comboTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const floatIdRef         = useRef(0);
  const particleIdRef      = useRef(0);
  const hitCountRef        = useRef(0);
  const totalDamageRef     = useRef(0);
  const maxSingleHitRef    = useRef(0);
  const rageCountRef       = useRef(0);
  const rageTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRagingRef        = useRef(false);   // sync ref for use inside callbacks
  const reactionIdxRef     = useRef(0);       // cycles through monster reactions
  const monsterHPRef       = useRef(HP_MAX);  // tracks current HP for TTS mode selection

  // ── TTS ──────────────────────────────────────────────────────────────────────
  const { speak, stop, isSupported: ttsSupported, voiceEnabled, setVoiceEnabled } = useTTS();

  const scene: SceneConfig = getScene(sceneId);
  const tool: ToolConfig   = getTool(toolId);
  const taunts             = monster.taunts ?? [];
  const activeTaunt        = taunts.length > 0 ? taunts[tauntIndex % taunts.length] : null;
  const isOver             = victoryPhase > 0;

  // ─── Defeat detection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (monsterHP <= 0 && victoryPhase === 0) {
      stop(); // silence any mid-sentence reaction
      // Phase 1: KO moment
      setVictoryPhase(1);
      setKoText(pickRandom(KO_TEXTS));
      // Phase 2: overlay after animation
      setTimeout(() => {
        setVictoryPhase(2);
        setVictoryMsg(pickRandom(VICTORY_MESSAGES)(monster.name));
      }, 900);
    }
  }, [monsterHP, victoryPhase, monster.name, stop]);

  // ─── Spawn helpers ────────────────────────────────────────────────────────────
  const spawnParticle = useCallback((scn: SceneConfig) => {
    const id = ++particleIdRef.current;
    const emoji = pickRandom(scn.particles);
    const x = 10 + Math.random() * 80;
    const delay = Math.random() * 0.15;
    setParticles((p) => [...p.slice(-4), { id, emoji, x, delay }]);
    setTimeout(() => setParticles((p) => p.filter((x) => x.id !== id)), 1200);
  }, []);

  const spawnFloat = useCallback((text: string, color: string, big = false, speech = false) => {
    const id = ++floatIdRef.current;
    // Speech bubbles stay near center; impact texts scatter more
    const x = speech ? (-15 + Math.random() * 30) : (-40 + Math.random() * 80);
    const y = speech ? (10 + Math.random() * 20) : (-20 + Math.random() * 40);
    setFloats((f) => [
      ...f.slice(-6),
      { id, text, x, y, color, big, speech },
    ]);
    setTimeout(
      () => setFloats((f) => f.filter((item) => item.id !== id)),
      speech ? FLOAT_DURATION + 600 : FLOAT_DURATION,
    );
  }, []);

  // ─── Rage mode ───────────────────────────────────────────────────────────────
  const activateRage = useCallback(() => {
    if (isRagingRef.current) return;
    isRagingRef.current = true;
    setIsRaging(true);
    rageCountRef.current += 1;
    spawnFloat("🔥 RAGE MODE!", "#FF4500", true);

    if (rageTimerRef.current) clearTimeout(rageTimerRef.current);
    rageTimerRef.current = setTimeout(() => {
      isRagingRef.current = false;
      setIsRaging(false);
      setRage(0);
    }, RAGE_DURATION);
  }, [spawnFloat]);

  // ─── Core attack handler ─────────────────────────────────────────────────────
  const handleAttack = useCallback(
    (attackId: AttackId) => {
      if (isOver) return;

      const attack = ATTACKS.find((a) => a.id === attackId)!;
      const base = randInt(attack.minDmg, attack.maxDmg);
      const damage = isRagingRef.current ? base * 2 : base;

      // Track stats
      hitCountRef.current += 1;
      totalDamageRef.current += damage;
      if (damage > maxSingleHitRef.current) maxSingleHitRef.current = damage;

      setHits((h) => h + 1);

      // Combo
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      setCombo((c) => {
        const next = c + 1;
        if (next > bestComboRef.current) bestComboRef.current = next;
        return next;
      });
      comboTimerRef.current = setTimeout(() => setCombo(0), COMBO_TIMEOUT);

      // Monster animation (different per attack type)
      setHitAnim(attackId);
      setTimeout(() => setHitAnim(null), attack.squashDuration + 50);

      // Floating texts — mechanically different per attack
      if (attackId === "slap") {
        // Slap spawns TWO floats (the rapid-fire feel)
        spawnFloat(pickRandom(attack.texts), attack.floatColor);
        setTimeout(() => spawnFloat(pickRandom(attack.extraTexts), "#9CA3AF"), 80);
      } else if (attackId === "punch") {
        // Punch spawns ONE big centered float
        const isComboHit = hitCountRef.current > 1 && hitCountRef.current % 3 === 0;
        spawnFloat(
          isComboHit ? attack.comboText : pickRandom(attack.texts),
          isRagingRef.current ? "#FF4500" : attack.floatColor,
          true,
        );
      } else {
        // Roast spawns italic mental-damage float in purple
        spawnFloat(pickRandom(attack.texts), attack.floatColor);
      }

      // Scene particles every 2nd hit
      if (hitCountRef.current % 2 === 0) spawnParticle(getScene(sceneId));

      // Speech bubble reaction every 3rd hit — the monster defends themselves
      if (hitCountRef.current % 3 === 0) {
        const pool = monster.reactions?.length ? monster.reactions : FALLBACK_REACTIONS;
        const reaction = pool[reactionIdxRef.current % pool.length];
        reactionIdxRef.current += 1;
        // Visual bubble + TTS fire together after a short sync delay
        setTimeout(() => {
          spawnFloat(reaction, "#1F2937", false, true);
          // angry mode when enemy is near death (< 30% HP)
          const mode = (monsterHPRef.current / HP_MAX) < 0.3 ? "angry" : "sarcastic";
          speak(reaction, mode);
        }, 180);
      }

      // Cycle taunts
      if (taunts.length > 0) setTauntIndex((i) => (i + 1) % taunts.length);

      // Rage meter fill
      if (!isRagingRef.current) {
        setRage((r) => {
          const next = Math.min(RAGE_MAX, r + attack.rageFill);
          if (next >= RAGE_MAX) activateRage();
          return next >= RAGE_MAX ? RAGE_MAX : next;
        });
      }

      // Reduce HP — keep ref in sync for TTS mode detection in callbacks
      setMonsterHP((hp) => {
        const next = Math.max(0, hp - damage);
        monsterHPRef.current = next;
        return next;
      });
    },
    [isOver, sceneId, taunts.length, monster.reactions, spawnFloat, spawnParticle, activateRage, speak],
  );

  const handleTap = useCallback(() => {
    handleAttack(pickRandom(ATTACKS).id);
  }, [handleAttack]);

  // ─── Scene flavor text ───────────────────────────────────────────────────────
  const [flavorText, setFlavorText] = useState(() => pickRandom(scene.flavorTexts));
  useEffect(() => { setFlavorText(pickRandom(scene.flavorTexts)); }, [scene]);
  const flavorHit = hits > 0 && hits % 5 === 0;
  useEffect(() => {
    if (flavorHit) setFlavorText(pickRandom(scene.flavorTexts));
  }, [flavorHit, scene]);

  // ─── Derived visuals ─────────────────────────────────────────────────────────
  const hpPct   = (monsterHP / HP_MAX) * 100;
  const hpColor = hpPct > 50 ? "#22C55E" : hpPct > 20 ? "#FFD600" : "#EF4444";
  const ragePct = (rage / RAGE_MAX) * 100;

  // Monster animation variant based on last hit type
  const monsterAnimate = (() => {
    if (victoryPhase === 1) return { rotate: 720, scale: 0, opacity: 0 };
    if (hitAnim === "slap")  return { scaleX: 1.18, scaleY: 0.82, rotate: 5, scale: 1, opacity: 1 };
    if (hitAnim === "punch") return { scaleX: 1.38, scaleY: 0.62, rotate: -10, scale: 1, opacity: 1 };
    if (hitAnim === "roast") return { scale: 0.72, scaleX: 1, scaleY: 1, rotate: 0, opacity: 1 };
    return { scaleX: 1, scaleY: 1, scale: 1, rotate: 0, opacity: 1 };
  })();

  const monsterTransition = (() => {
    if (victoryPhase === 1) return { duration: 0.8, ease: "easeIn" as const };
    if (hitAnim === "punch") return { type: "spring" as const, stiffness: 800, damping: 8 };
    if (hitAnim === "roast") return { type: "spring" as const, stiffness: 300, damping: 8 };
    return { type: "spring" as const, stiffness: 700, damping: 10 };
  })();

  // ─── Render ───────────────────────────────────────────────────────────────────
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
      <div className="w-full flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-gray-500">
            Monster HP
          </span>
          <div className="flex items-center gap-2">
            {/* Voice toggle — only rendered when browser supports TTS */}
            {ttsSupported && (
              <VoiceToggle enabled={voiceEnabled} onToggle={setVoiceEnabled} />
            )}
            <span className="text-base font-black tabular-nums" style={{ color: hpColor }}>
              {monsterHP}
              <span className="text-[10px] text-gray-400 font-bold ml-0.5">/ {HP_MAX}</span>
            </span>
          </div>
        </div>
        <div className="w-full h-2.5 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            animate={{ width: `${hpPct}%` }}
            transition={{ duration: 0.25 }}
            className="h-full rounded-full"
            style={{ backgroundColor: hpColor }}
          />
        </div>
      </div>

      {/* ── RAGE METER ─────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-0.5">
        <div className="flex items-center justify-between">
          <AnimatePresence mode="wait">
            {isRaging ? (
              <motion.span
                key="raging"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs font-black uppercase tracking-widest text-orange-500"
              >
                🔥 RAGE MODE ACTIVE
              </motion.span>
            ) : (
              <motion.span
                key="calm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-black uppercase tracking-widest text-gray-400"
              >
                Rage Meter
              </motion.span>
            )}
          </AnimatePresence>
          {isRaging && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ repeat: Infinity, duration: 0.4 }}
              className="text-[10px] font-black text-orange-500 uppercase"
            >
              2× DMG
            </motion.span>
          )}
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            animate={{ width: `${ragePct}%` }}
            transition={{ duration: 0.1 }}
            className={`h-full rounded-full transition-colors duration-300 ${
              isRaging ? "bg-orange-500" : ragePct > 70 ? "bg-orange-400" : "bg-orange-300"
            }`}
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
            <span className="text-sm font-black" style={{ color: combo > 2 ? "#FFD600" : "#9CA3AF" }}>
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

      {/* ── MONSTER ARENA ──────────────────────────────────────────────────── */}
      <motion.div
        className={`relative flex items-center justify-center w-full rounded-3xl transition-colors duration-500 ${scene.bgClass}`}
        style={{ height: "clamp(120px, 25vh, 224px)" }}
        animate={isRaging ? { boxShadow: ["0 0 0px #FF450000", "0 0 18px #FF4500aa", "0 0 6px #FF450055"] } : { boxShadow: "0 0 0px #00000000" }}
        transition={isRaging ? { repeat: Infinity, duration: 0.6 } : {}}
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

        {/* Floating hit texts + speech bubble reactions */}
        <AnimatePresence>
          {floats.map((f) =>
            f.speech ? (
              /* ── Speech bubble: defensive reaction ── */
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 0, scale: 0.75, x: f.x }}
                animate={{ opacity: [0, 1, 1, 0], y: -55 + f.y, scale: 1, x: f.x }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3, times: [0, 0.08, 0.72, 1], ease: "easeOut" }}
                className="absolute top-6 pointer-events-none select-none z-10"
              >
                <div className="relative">
                  <div
                    className="bg-white border-2 border-gray-800 rounded-2xl rounded-bl-sm px-3 py-1.5 shadow-md max-w-[150px] text-center"
                    style={{ boxShadow: "2px 2px 0 #1F2937" }}
                  >
                    <span className="text-[10px] font-bold italic text-gray-800 leading-tight block">
                      &ldquo;{f.text}&rdquo;
                    </span>
                  </div>
                  {/* Tail of the speech bubble */}
                  <div className="absolute -bottom-2 left-4 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-gray-800" />
                  <div className="absolute -bottom-1.5 left-[17px] w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white" />
                </div>
              </motion.div>
            ) : (
              /* ── Standard impact text ── */
              <motion.div
                key={f.id}
                initial={{ opacity: 1, y: 0, scale: f.big ? 0.7 : 0.5, x: f.x }}
                animate={{ opacity: 0, y: -80 + f.y, scale: f.big ? 1.5 : 1.2, x: f.x }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: "easeOut" }}
                className="absolute top-4 pointer-events-none select-none z-10"
              >
                <span
                  className="comic-sticker text-white"
                  style={{
                    backgroundColor: f.color,
                    color: f.color === "#FFD600" ? "#000" : "#fff",
                    fontSize: f.big ? "0.9rem" : "0.75rem",
                    ["--sticker-rotate" as string]: `${-6 + Math.random() * 12}deg`,
                  }}
                >
                  {f.text}
                </span>
              </motion.div>
            )
          )}
        </AnimatePresence>

        {/* Monster emoji */}
        <motion.button
          onClick={handleTap}
          animate={monsterAnimate}
          transition={monsterTransition}
          className="text-8xl select-none cursor-pointer transition-none drop-shadow-lg z-10"
          disabled={isOver}
        >
          {monster.emoji}
        </motion.button>

        {/* KO flash overlay (phase 1) */}
        <AnimatePresence>
          {victoryPhase === 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.9, 0.6, 0.9, 0] }}
              transition={{ duration: 0.8, times: [0, 0.1, 0.3, 0.5, 1] }}
              className="absolute inset-0 rounded-3xl bg-white z-30 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* KO text (phase 1) */}
        <AnimatePresence>
          {victoryPhase === 1 && (
            <motion.div
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: [0, 1.4, 1.2], opacity: [1, 1, 1] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute z-40 pointer-events-none"
            >
              <span className="font-display text-3xl text-brand-red tracking-widest drop-shadow-lg">
                {koText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Flavor text every 5th hit */}
        {flavorHit && victoryPhase === 0 && (
          <motion.div
            key={`flavor-${hits}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 left-2 right-2 text-center z-10"
          >
            <span className="font-display text-sm text-brand-red tracking-wider inline-block bg-white/80 backdrop-blur-sm rounded-full px-4 py-1">
              {flavorText}
            </span>
          </motion.div>
        )}

        {/* Tool indicator */}
        <AnimatePresence mode="wait">
          {victoryPhase === 0 && (
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
          )}
        </AnimatePresence>

        {/* Rage mode indicator inside arena */}
        <AnimatePresence>
          {isRaging && victoryPhase === 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2 left-3 z-10 pointer-events-none select-none"
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 0.3 }}
                className="text-xl"
              >
                🔥
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VICTORY OVERLAY (phase 2) ─────────────────────────────────────── */}
        <AnimatePresence>
          {victoryPhase === 2 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl bg-black/82 backdrop-blur-sm z-20 px-5 text-center gap-1.5"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{ type: "spring", stiffness: 400, damping: 10, delay: 0.05 }}
                className="text-4xl"
              >
                💀
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-2xl text-brand-yellow tracking-wider leading-tight"
              >
                DEFEATED!
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-white text-[11px] leading-snug opacity-90 max-w-[190px]"
              >
                {victoryMsg}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── MONSTER NAME + ARCHETYPE + TAUNT ──────────────────────────────── */}
      <div className="w-full text-center min-h-[32px]">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm font-black uppercase tracking-wider text-gray-500">
            {monster.name}
          </p>
          {monster.archetype && (
            <span
              className="text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 text-white"
              style={{ backgroundColor: monster.color + "CC" }}
            >
              {monster.archetype}
            </span>
          )}
        </div>
        {monster.aura && (
          <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-0.5">
            ✦ {monster.aura}
          </p>
        )}
        <AnimatePresence mode="wait">
          {activeTaunt && victoryPhase === 0 && (
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
            whileTap={{ scale: 0.88 }}
            onClick={() => handleAttack(attack.id)}
            disabled={isOver}
            className="flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-2xl font-black uppercase text-[11px] tracking-wide shadow-md disabled:opacity-40 transition-all"
            style={{
              backgroundColor: isRaging ? "#FF4500" : attack.color,
              color: attack.color === "#FFD600" && !isRaging ? "#000" : "#fff",
              border: isRaging ? "2px solid rgba(255,255,255,0.3)" : "2px solid rgba(0,0,0,0.06)",
            }}
          >
            <span className="text-xl leading-none">{attack.emoji}</span>
            {attack.label}
          </motion.button>
        ))}
      </div>

      {/* ── CLAIM VICTORY / SKIP ───────────────────────────────────────────── */}
      {victoryPhase === 2 ? (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileTap={{ scale: 0.95 }}
          onClick={() =>
            onFinish(
              hits,
              bestComboRef.current,
              sceneId,
              toolId,
              totalDamageRef.current,
              maxSingleHitRef.current,
              rageCountRef.current,
            )
          }
          className="w-full py-2.5 rounded-2xl bg-brand-yellow text-black text-base font-black uppercase tracking-wide shadow-md border-2 border-black/5"
        >
          🏆 Claim Victory
        </motion.button>
      ) : (
        <button
          onClick={() =>
            onFinish(
              hits,
              bestComboRef.current,
              sceneId,
              toolId,
              totalDamageRef.current,
              maxSingleHitRef.current,
              rageCountRef.current,
            )
          }
          disabled={victoryPhase === 1}
          className="text-[11px] font-bold text-gray-400 uppercase tracking-wide py-1 disabled:opacity-0"
        >
          {hits === 0 ? "Skip" : "I'm Done 😌"}
        </button>
      )}
    </div>
  );
}
