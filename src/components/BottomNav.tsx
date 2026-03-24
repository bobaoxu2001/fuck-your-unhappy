import { Screen } from "@/lib/types";

interface BottomNavProps {
  screen: Screen;
}

export default function BottomNav({ screen }: BottomNavProps) {
  const isMainFlow = screen !== "summary";

  return (
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-white z-50 flex items-end justify-around px-6 pb-5 pt-3 max-w-md mx-auto">
      <button className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className={`text-xl ${isMainFlow ? "opacity-100" : "opacity-40"}`}>
          👾
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Monsters
        </span>
      </button>

      <button className="relative -top-5 w-16 h-16 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg border-4 border-white">
        <span className="text-2xl">⚡</span>
      </button>

      <button className="flex flex-col items-center gap-0.5 pb-0.5">
        <span className={`text-xl ${!isMainFlow ? "opacity-100" : "opacity-40"}`}>
          📜
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          History
        </span>
      </button>
    </nav>
  );
}
