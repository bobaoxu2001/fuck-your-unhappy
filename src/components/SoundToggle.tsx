"use client";

import { motion } from "framer-motion";

interface SoundToggleProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => onToggle(!enabled)}
      title={enabled ? "Mute sound effects" : "Unmute sound effects"}
      aria-label={enabled ? "Mute sound effects" : "Unmute sound effects"}
      aria-pressed={enabled}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border transition-all duration-200 ${
        enabled
          ? "bg-purple-50 text-brand-purple border-purple-200"
          : "bg-gray-100 text-gray-400 border-gray-200"
      }`}
    >
      <span className="text-[11px] leading-none">{enabled ? "🥁" : "🔕"}</span>
      <span>{enabled ? "SFX" : "Off"}</span>
    </motion.button>
  );
}
