export default function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-slate-950 text-white" role="banner">
      <div className="mx-auto flex h-16 w-full max-w-[1500px] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-400 font-bold text-slate-950" aria-hidden="true">O</span>
          <div className="min-w-0"><div className="truncate font-semibold tracking-tight">Obvolávání</div><div className="truncate text-xs text-slate-400">Interaktivní portfolio demo</div></div>
        </div>
        <span className="shrink-0 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold text-teal-200">Demo · syntetická data</span>
      </div>
    </header>
  );
}
