export default function AppHeader() {
  return (
    <header className="relative z-10 w-full flex items-center justify-between gap-3 px-4 pt-4 pb-2 md:px-6 md:pt-6">
      <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center text-sm font-black shadow-[0_3px_0_rgba(0,0,0,0.12)]">
        😤
      </div>
      <h1 className="font-display text-[24px] tracking-wide leading-none md:text-3xl">
        <span className="text-black">FUCK&nbsp;YOUR</span>
        <span className="yellow-highlight ml-1 text-black">UNHAPPY</span>
      </h1>
      </div>
      <div className="hidden rounded-full bg-white/75 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-gray-500 shadow-sm ring-1 ring-black/5 sm:block">
        Stress relief arcade
      </div>
    </header>
  );
}
