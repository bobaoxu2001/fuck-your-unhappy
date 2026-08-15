"use client";

import Image from "next/image";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[radial-gradient(circle_at_top_left,#FFE4F3_0,#FAF5FF_45%,#E0F2FE_100%)] p-5 text-center">
      <section className="w-full max-w-md rounded-[2rem] bg-white/95 p-6 shadow-2xl ring-1 ring-black/5">
        <div className="relative mx-auto aspect-square w-40 overflow-hidden rounded-[1.5rem] bg-purple-100">
          <Image src="/stress-goblin.webp" alt="The stress goblin looking dramatically annoyed" fill sizes="160px" className="object-cover" />
        </div>
        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.2em] text-brand-purple">Portal hiccup</p>
        <h1 className="mt-1 font-display text-5xl leading-none tracking-wide">THE BOSS ESCAPED</h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-gray-600">
          Your vent was not published or shared. Reload this private round and summon it again.
        </p>
        <button
          type="button"
          onClick={reset}
          className="generate-btn mt-5 min-h-12 w-full rounded-full px-5 py-3 text-sm font-black uppercase tracking-wide text-black shadow-[0_4px_0_rgba(0,0,0,0.12)]"
        >
          Reopen the portal
        </button>
      </section>
    </main>
  );
}
