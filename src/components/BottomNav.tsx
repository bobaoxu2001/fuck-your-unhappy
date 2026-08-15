"use client";

import { Screen } from "@/lib/types";

interface BottomNavProps {
  screen: Screen;
  onRestart?: () => void;
}

const STAGES: Array<{ screen: Screen; label: string; icon: string }> = [
  { screen: "input", label: "Name", icon: "✎" },
  { screen: "reveal", label: "Boss", icon: "✦" },
  { screen: "arena", label: "Play", icon: "⚡" },
  { screen: "summary", label: "Release", icon: "✓" },
];

export default function BottomNav({ screen, onRestart }: BottomNavProps) {
  const restartLabel = screen === "summary"
    ? "Start a new round"
    : "Leave this round and start over";

  return (
    <nav
      aria-label="Current reset stage"
      className="bottom-nav pointer-events-none fixed bottom-0 left-0 right-0 z-50 mx-auto flex max-w-md items-end justify-center gap-2 bg-white/95 px-3 pt-2 shadow-2xl backdrop-blur md:bottom-4 md:rounded-[2rem] md:border md:border-black/5"
    >
      {STAGES.slice(0, 2).map((stage) => (
        <div
          key={stage.screen}
          aria-current={screen === stage.screen ? "step" : undefined}
          className={`flex min-w-11 flex-col items-center gap-0.5 pb-3 transition-opacity ${
            screen === stage.screen ? "opacity-100" : "opacity-40"
          }`}
        >
          <span className="text-lg font-black" aria-hidden>{stage.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-700">{stage.label}</span>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          if (screen !== "input") onRestart?.();
        }}
        disabled={screen === "input" || !onRestart}
        aria-label={screen === "input" ? "Current round" : restartLabel}
        title={screen === "input" ? "Current round" : restartLabel}
        className="pointer-events-auto relative -top-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-yellow text-xl shadow-lg transition-transform active:scale-95 disabled:cursor-default disabled:opacity-90"
      >
        <span aria-hidden>↻</span>
      </button>

      {STAGES.slice(2).map((stage) => (
        <div
          key={stage.screen}
          aria-current={screen === stage.screen ? "step" : undefined}
          className={`flex min-w-11 flex-col items-center gap-0.5 pb-3 transition-opacity ${
            screen === stage.screen ? "opacity-100" : "opacity-40"
          }`}
        >
          <span className="text-lg font-black" aria-hidden>{stage.icon}</span>
          <span className="text-[9px] font-black uppercase tracking-wider text-gray-700">{stage.label}</span>
        </div>
      ))}
    </nav>
  );
}
