"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import type { CallingView } from "@/components/calling/uiState";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function Navbar({ view, onViewChange }: { view: CallingView; onViewChange: (view: CallingView) => void }) {
  const { isDark, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 4);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <header className="app-header sticky top-0 z-40" data-scrolled={scrolled} role="banner">
      <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center gap-x-4 gap-y-1 px-4 py-1 sm:min-h-16 sm:flex-nowrap sm:gap-x-6 sm:px-6 sm:py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="brand-mark grid size-9 shrink-0 place-items-center rounded-[10px] border text-xs font-black tracking-[-0.08em]" aria-hidden="true">DC</span>
          <div className="min-w-0"><div className="dc-text-primary truncate text-sm font-extrabold uppercase tracking-[0.08em] sm:text-base">Digital Call</div><div className="brand-subtitle dc-text-muted truncate text-[11px] font-medium">Pracovní prostor</div></div>
        </div>
        <nav aria-label="Hlavní zobrazení" className="order-3 flex w-full flex-wrap items-center gap-x-1 gap-y-0.5 sm:order-none sm:w-auto sm:flex-nowrap">
          <button type="button" onClick={() => onViewChange("today")} aria-current={view === "today" ? "page" : undefined} data-active={view === "today"} className="nav-link focus-ring h-9 whitespace-nowrap rounded-lg px-3 text-sm font-semibold">K řešení</button>
          <button type="button" onClick={() => onViewChange("new")} aria-current={view === "new" ? "page" : undefined} data-active={view === "new"} className="nav-link focus-ring h-9 whitespace-nowrap rounded-lg px-3 text-sm font-semibold">Nové kontakty</button>
          <button type="button" onClick={() => onViewChange("process")} aria-current={view === "process" ? "page" : undefined} data-active={view === "process"} className="nav-link focus-ring h-9 whitespace-nowrap rounded-lg px-3 text-sm font-semibold">Proces</button>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="demo-badge dc-text-muted text-[11px] font-medium sm:text-xs">Demo<span className="hidden md:inline"> · syntetická data</span></span>
          <button type="button" onClick={toggleTheme} className="button-quiet size-11 px-0" aria-label={isDark ? "Přepnout na světlý motiv" : "Přepnout na tmavý motiv"} title={isDark ? "Světlý motiv" : "Tmavý motiv"}>
            {isDark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
