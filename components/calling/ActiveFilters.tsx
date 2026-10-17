"use client";

import { X } from "lucide-react";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import { SOURCE_LABEL } from "./labels";
import type { QueueFilters } from "./uiState";

export default function ActiveFilters({ filters, onChange }: { filters: QueueFilters; onChange: (filters: QueueFilters) => void }) {
  const active = filters.query.trim() !== "" || filters.source !== "all" || filters.status !== "all";
  if (!active) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Aktivní filtry fronty">
      <span className="dc-text-muted mr-1 text-xs font-semibold uppercase tracking-wide">Výběr fronty</span>
      {filters.query.trim() ? <button type="button" onClick={() => onChange({ ...filters, query: "" })} className="active-filter focus-ring inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"><span className="max-w-[min(50vw,18rem)] truncate">„{filters.query.trim()}“</span><X className="size-3 shrink-0" aria-hidden="true" /></button> : null}
      {filters.source !== "all" ? <button type="button" onClick={() => onChange({ ...filters, source: "all" })} className="active-filter focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">{SOURCE_LABEL[filters.source]} <X className="size-3" aria-hidden="true" /></button> : null}
      {filters.status !== "all" ? <button type="button" onClick={() => onChange({ ...filters, status: "all" })} className="active-filter focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">{COLUMN_LABEL_CS[filters.status]} <X className="size-3" aria-hidden="true" /></button> : null}
      <button type="button" onClick={() => onChange({ query: "", source: "all", status: "all" })} className="button-quiet h-8 px-2 text-xs">Zrušit vše</button>
    </div>
  );
}
