import { Screen } from "@/lib/types";
import { GalleryTab } from "@/components/HistoryGallery";

interface BottomNavProps {
  screen: Screen;
  onOpenGallery: (tab: GalleryTab) => void;
}

export default function BottomNav({ screen, onOpenGallery }: BottomNavProps) {
  const isMainFlow = screen !== "summary";

  return (
    <nav
      aria-label="App sections"
      className="bottom-nav pointer-events-none fixed bottom-0 left-0 right-0 bg-white/95 z-50 flex items-end justify-around px-6 pb-5 pt-3 max-w-md mx-auto shadow-2xl backdrop-blur md:bottom-4 md:rounded-[2rem] md:border md:border-black/5"
    >
      <button
        onClick={() => onOpenGallery("monsters")}
        className="pointer-events-auto flex flex-col items-center gap-0.5 pb-0.5 transition-opacity hover:opacity-100"
      >
        <span className={`text-xl ${isMainFlow ? "opacity-100" : "opacity-40"}`}>👾</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          Monsters
        </span>
      </button>

      <button
        onClick={() => onOpenGallery("history")}
        aria-label="Open history"
        className="pointer-events-auto relative -top-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-yellow shadow-lg border-4 border-white transition-transform hover:scale-105 active:scale-95"
      >
        <span className="text-2xl">⚡</span>
      </button>

      <button
        onClick={() => onOpenGallery("history")}
        className="pointer-events-auto flex flex-col items-center gap-0.5 pb-0.5 transition-opacity hover:opacity-100"
      >
        <span className={`text-xl ${!isMainFlow ? "opacity-100" : "opacity-40"}`}>📜</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
          History
        </span>
      </button>
    </nav>
  );
}
