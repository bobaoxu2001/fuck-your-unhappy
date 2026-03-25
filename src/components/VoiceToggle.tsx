"use client";

import { motion } from "framer-motion";

interface VoiceToggleProps {
  enabled: boolean;
  onToggle: (v: boolean) => void;
}

export function VoiceToggle({ enabled, onToggle }: VoiceToggleProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.88 }}
      onClick={() => onToggle(!enabled)}
      title={enabled ? "Mute enemy voice" : "Unmute enemy voice"}
      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border transition-all duration-200 ${
        enabled
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-400 border-gray-200"
      }`}
    >
      <span className="text-[11px] leading-none">{enabled ? "🔊" : "🔇"}</span>
      <span>{enabled ? "Voice" : "Muted"}</span>
    </motion.button>
  );
}
