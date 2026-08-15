"use client";

import { motion } from "framer-motion";

interface VoiceToggleProps {
  supported: boolean;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}

export function VoiceToggle({ supported, enabled, onToggle }: VoiceToggleProps) {
  if (!supported) return null;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.88 }}
      onClick={() => onToggle(!enabled)}
      title={enabled ? "Mute enemy voice" : "Unmute enemy voice"}
      aria-label={enabled ? "Mute fictional boss voice" : "Turn on fictional boss voice"}
      aria-pressed={enabled}
      className={`flex min-h-10 items-center gap-1 rounded-xl border px-2 py-1 text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
        enabled
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      <span className="text-[11px] leading-none" aria-hidden>{enabled ? "🔊" : "🔇"}</span>
      <span>{enabled ? "On" : "Off"}</span>
    </motion.button>
  );
}
