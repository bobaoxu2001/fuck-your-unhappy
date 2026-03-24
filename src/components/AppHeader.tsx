export default function AppHeader() {
  return (
    <header className="w-full flex items-center gap-2 px-4 pt-3 pb-2">
      <div className="w-7 h-7 rounded-full bg-brand-yellow flex items-center justify-center text-xs font-black">
        😤
      </div>
      <h1 className="font-display text-[22px] tracking-wide leading-none">
        <span className="text-black">FUCK&nbsp;YOUR</span>
        <span className="yellow-highlight ml-1 text-black">UNHAPPY</span>
      </h1>
    </header>
  );
}
