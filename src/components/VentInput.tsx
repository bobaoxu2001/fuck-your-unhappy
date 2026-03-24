"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface VentInputProps {
  onSubmit: (text: string) => void;
}

/* Comic stickers scattered around the monster preview card */
const STICKERS = [
  { text: "BOOM!", bg: "#EF4444", rotate: "-6deg", top: "6%", left: "-2%" },
  { text: "TOSS", bg: "#FFD600", color: "#000", rotate: "4deg", top: "2%", right: "8%" },
  { text: "HIT", bg: "#7C3AED", rotate: "-3deg", top: "40%", right: "-4%" },
  { text: "SLAP", bg: "#FF1493", rotate: "5deg", bottom: "22%", left: "-2%" },
  { text: "TAKE THAT!", bg: "#FFD600", color: "#000", rotate: "-4deg", bottom: "14%", right: "-4%" },
];

export default function VentInput({ onSubmit }: VentInputProps) {
  const [text, setText] = useState("");
  const [stressPreview] = useState(10);

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2 w-full max-w-sm mx-auto px-3"
    >
      {/* Stress Level Bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            Stress Level
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] text-gray-400 font-semibold">00%</span>
            <span className="text-base font-black text-brand-purple">{stressPreview}%</span>
          </div>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${stressPreview}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full stress-bar-gradient"
          />
        </div>
      </div>

      {/* Monster Preview Card with Stickers */}
      <div className="relative w-full">
        {/* Scattered comic stickers */}
        {STICKERS.map((s) => (
          <motion.div
            key={s.text}
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: s.rotate }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: Math.random() * 0.3 }}
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

        {/* Card */}
        <div className="w-full rounded-2xl bg-white shadow-lg border border-gray-100 p-3 flex flex-col items-center">
          <div className="w-full h-40 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 flex items-center justify-center overflow-hidden">
            <motion.span
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="text-8xl"
            >
              👹
            </motion.span>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-600">
          Who ruined your day?
        </label>
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Manager, ex-friend, printer..."
            maxLength={200}
            className="w-full px-5 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm font-medium placeholder:text-gray-400 focus:outline-none focus:border-brand-purple focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Generate Button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-3.5 rounded-full generate-btn text-black text-lg font-black uppercase tracking-wide shadow-[0_4px_0_0_rgba(0,0,0,0.10)] disabled:opacity-40 transition-all"
      >
        Generate Monster
      </motion.button>
    </motion.div>
  );
}
