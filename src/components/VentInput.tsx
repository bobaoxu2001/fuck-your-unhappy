"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MAX_INPUT_LENGTH } from "@/lib/safety";

interface VentInputProps {
  onSubmit: (text: string) => void;
  loading?: boolean;
  error?: string;
}

const INITIAL_STRESS = 10;

interface Sticker {
  text: string;
  bg: string;
  color?: string;
  rotate: string;
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  delay: number;
}

const STICKERS: Sticker[] = [
  { text: "BOOM!", bg: "#EF4444", rotate: "-6deg", top: "6%", left: "-2%", delay: 0.04 },
  { text: "TOSS", bg: "#FFD600", color: "#000", rotate: "4deg", top: "2%", right: "8%", delay: 0.12 },
  { text: "HIT", bg: "#7C3AED", rotate: "-3deg", top: "40%", right: "-4%", delay: 0.2 },
  { text: "SLAP", bg: "#FF1493", rotate: "5deg", bottom: "22%", left: "-2%", delay: 0.28 },
  { text: "TAKE THAT!", bg: "#FFD600", color: "#000", rotate: "-4deg", bottom: "14%", right: "-4%", delay: 0.36 },
];

export default function VentInput({ onSubmit, loading, error }: VentInputProps) {
  const [text, setText] = useState("");
  const [touched, setTouched] = useState(false);
  const trimmed = text.trim();
  const showEmpty = touched && !trimmed;

  const handleSubmit = () => {
    setTouched(true);
    if (trimmed && !loading) onSubmit(trimmed);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid w-full max-w-4xl mx-auto gap-4 px-1 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-5"
    >
      <section className="flex flex-col gap-3 rounded-[2rem] bg-white/80 p-4 shadow-xl ring-1 ring-black/5 backdrop-blur md:gap-4 md:p-7">
        <div className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-purple-dark px-3 py-1 text-[11px] font-black uppercase tracking-widest text-white">
          <span>⚡</span>
          30-second stress boss fight
        </div>
        <div>
          <h2 className="font-display text-5xl leading-[0.9] tracking-wide text-black md:text-7xl">
            Turn bad vibes into a boss fight.
          </h2>
          <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-gray-600 md:mt-3 md:text-base">
            Type the thing ruining your mood. We&apos;ll turn it into a ridiculous stress monster you can roast, slap, and send back to the shadow realm.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {["Vent", "Fight", "Release"].map((step, index) => (
            <div key={step} className="rounded-2xl bg-gray-50 px-2 py-2 ring-1 ring-black/5">
              <div className="text-lg font-black text-brand-purple">{index + 1}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">{step}</div>
            </div>
          ))}
        </div>
        <div className="flex w-full flex-col gap-2 rounded-[1.5rem] bg-white/95 p-3 ring-1 ring-black/5">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
            What made you unhappy?
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
            placeholder="Manager, ex-friend, printer..."
            maxLength={MAX_INPUT_LENGTH}
            aria-invalid={showEmpty || Boolean(error)}
            className="w-full px-5 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-base font-semibold placeholder:text-gray-400 focus:outline-none focus:border-brand-purple focus:bg-white transition-colors"
          />
          <div className="flex items-center justify-between px-1 min-h-4">
            <p className="text-[11px] font-semibold text-brand-red">
              {showEmpty ? "Give the monster portal something to work with." : error}
            </p>
            <span className="text-[10px] font-bold text-gray-300">
              {text.length}/{MAX_INPUT_LENGTH}
            </span>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="w-full py-4 rounded-full generate-btn text-black text-lg font-black uppercase tracking-wide shadow-[0_5px_0_0_rgba(0,0,0,0.12)] disabled:opacity-40 transition-all"
        >
          {loading ? "Summoning your stress monster..." : "Generate My Enemy"}
        </motion.button>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
              Current Stress Level
            </span>
            <span className="text-base font-black text-brand-purple">{INITIAL_STRESS}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${INITIAL_STRESS}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-full stress-bar-gradient"
            />
          </div>
        </div>
      </section>

      <section className="relative w-full max-w-sm mx-auto md:row-start-1 md:col-start-2">
        {STICKERS.map((s) => (
          <motion.div
            key={s.text}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: s.rotate }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: s.delay }}
            className="comic-sticker absolute z-10 text-white"
            style={{
              backgroundColor: s.bg,
              color: s.color || "#fff",
              ["--sticker-rotate" as string]: s.rotate,
              top: s.top,
              bottom: s.bottom,
              left: s.left,
              right: s.right,
            }}
          >
            {s.text}
          </motion.div>
        ))}

        <div className="w-full rounded-[2rem] bg-white shadow-2xl border border-gray-100 p-3 flex flex-col items-center">
          <div className="relative w-full h-52 rounded-[1.4rem] bg-gradient-to-br from-yellow-50 via-pink-50 to-purple-100 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-x-8 bottom-8 h-5 rounded-full bg-black/10 blur-md" />
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="relative text-8xl"
            >
              👹
            </motion.span>
          </div>
        </div>
      </section>

    </motion.div>
  );
}
