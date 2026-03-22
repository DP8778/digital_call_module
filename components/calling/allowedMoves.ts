import type { ColumnId } from "./types";

/** Jediný zdroj pravdy pro povolené přesuny mezi sloupci (uživatelské akce + DnD + menu). */
export const allowedMoves: Record<ColumnId, ColumnId[]> = {
  backlog: ["to_call"],

  to_call: ["backlog", "call_later", "meeting", "disqualified"],

  call_later: ["to_call", "meeting", "disqualified"],

  meeting: ["disqualified", "listed"],

  disqualified: [],

  listed: [],
};

export function isMoveAllowed(source: ColumnId, target: ColumnId): boolean {
  if (source === target) return false;
  return allowedMoves[source]?.includes(target) ?? false;
}

/** České názvy pro menu a UI */
export const COLUMN_LABEL_CS: Record<ColumnId, string> = {
  backlog: "Zásobník",
  to_call: "Kontakty k provolání",
  call_later: "Volat později",
  meeting: "Domluvené schůzky",
  listed: "Nabrané nemovitosti",
  disqualified: "Vyřazené kontakty",
};
