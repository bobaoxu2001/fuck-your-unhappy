import { Screen } from "@/lib/types";

interface BottomNavProps {
  screen: Screen;
}

export default function BottomNav({ screen }: BottomNavProps) {
  const isMainFlow = screen !== "summary";

  return (
    <nav
      aria-label="Current app section"
      className="bottom-nav fixed bottom-0 left-0 right-0 bg-white/95 z-50 flex items-end justify-around px-6 pb-5 pt-3 max-w-md mx-auto shadow-2xl backdrop-blur md:bottom-4 md:rounded-[2rem] md:border md:border-black/5"
    >
      <div className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className={`text-xl ${isMainFlow ? "opacity-100" : "opacity-40"}`}>
          👾
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Monsters
        </span>
      </div>

      <div className="relative -top-5 w-16 h-16 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg border-4 border-white">
        <span className="text-2xl">⚡</span>
      </div>

      <div className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className={`text-xl ${!isMainFlow ? "opacity-100" : "opacity-40"}`}>
          📜
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          History
        </span>
      </div>
    </nav>
  );
}
