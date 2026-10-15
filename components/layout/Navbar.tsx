"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className="control-glass sticky top-0 z-40 border-b" role="banner">
      <div className="mx-auto flex h-[60px] w-full max-w-[1500px] items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="brand-mark grid size-10 shrink-0 place-items-center rounded-[11px] border text-sm font-black tracking-[-0.08em]" aria-hidden="true">DC</span>
          <div className="min-w-0"><div className="dc-text-primary truncate text-sm font-extrabold uppercase tracking-[0.08em] sm:text-base">Digital Call</div><div className="dc-text-muted truncate text-[11px] font-medium">Pracovní prostor</div></div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <span className="glass-badge inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold sm:px-3"><span className="size-1.5 rounded-full bg-[var(--dc-accent)]" aria-hidden="true" /><span>Demo</span><span className="hidden sm:inline"> · syntetická data</span></span>
          <button type="button" onClick={toggleTheme} className="button-quiet size-11 px-0" aria-label={isDark ? "Přepnout na světlý motiv" : "Přepnout na tmavý motiv"} title={isDark ? "Světlý motiv" : "Tmavý motiv"}>
            {isDark ? <Sun className="size-[18px]" aria-hidden="true" /> : <Moon className="size-[18px]" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  );
}
