import Image from "next/image";
import Link from "next/link";
import { Screen } from "@/lib/types";

const STAGE_LABELS: Record<Screen, string> = {
  input: "Name it",
  reveal: "Meet it",
  arena: "Release it",
  summary: "Close the loop",
};

export default function AppHeader({ screen }: { screen: Screen }) {
  const compact = screen === "arena";

  return (
    <header
      className={`relative z-20 flex w-full items-center justify-between gap-3 px-4 pb-2 md:px-6 ${
        compact ? "pt-3" : "pt-4 md:pt-6"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={`${compact ? "h-8 w-8" : "h-10 w-10"} relative shrink-0 overflow-hidden rounded-full bg-brand-yellow shadow-[0_3px_0_rgba(0,0,0,0.12)] ring-2 ring-white`}>
          <Image
            src="/stress-goblin.webp"
            alt=""
            fill
            sizes="40px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <h1 className={`font-display leading-none tracking-wide text-black ${compact ? "text-xl" : "text-[1.65rem] md:text-3xl"}`}>
            UNHAPPY <span className="yellow-highlight">BUSTER</span>
          </h1>
          {!compact && (
            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
              FYU private stress arcade
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {!compact && (
          <Link
            href="/privacy"
            className="inline-flex min-h-9 items-center rounded-full bg-white/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-gray-500 ring-1 ring-black/5"
          >
            Privacy
          </Link>
        )}
        <div className="rounded-full bg-white/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-brand-purple shadow-sm ring-1 ring-black/5">
          {STAGE_LABELS[screen]}
        </div>
      </div>
    </header>
  );
}
