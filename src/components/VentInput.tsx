"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface VentInputProps {
  onSubmit: (text: string) => void;
}

export default function VentInput({ onSubmit }: VentInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto px-4"
    >
      <h1 className="text-3xl font-bold text-center">
        😤 What pissed you off?
      </h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="My boss said..."
        maxLength={200}
        className="w-full h-32 p-4 rounded-2xl border-2 border-gray-200 bg-white text-lg resize-none focus:outline-none focus:border-purple-400"
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim()}
        className="w-full py-4 rounded-2xl bg-red-500 text-white text-xl font-bold disabled:opacity-40 active:scale-95 transition-transform"
      >
        Summon the Monster 👊
      </button>
    </motion.div>
  );
}
