import type { ColumnId } from "./types";

/** Zachované procesní přechody původního prototypu. */
export const allowedMoves: Record<ColumnId, ColumnId[]> = {
  backlog: ["to_call"],
  to_call: ["backlog", "call_later", "meeting", "disqualified"],
  call_later: ["to_call", "meeting", "disqualified"],
  meeting: ["disqualified", "listed"],
  disqualified: [],
  listed: [],
};

export function isMoveAllowed(source: ColumnId, target: ColumnId): boolean {
  return source !== target && allowedMoves[source].includes(target);
}

export const COLUMN_LABEL_CS: Record<ColumnId, string> = {
  backlog: "Zásobník",
  to_call: "K provolání",
  call_later: "Volat později",
  meeting: "Domluvená schůzka",
  listed: "Nabraná nemovitost",
  disqualified: "Vyřazeno",
};

export const COLUMN_DESCRIPTION_CS: Record<ColumnId, string> = {
  backlog: "Nové kontakty bez zahájeného zpracování",
  to_call: "Kontakty připravené k dalšímu hovoru",
  call_later: "Kontakty s hovorem naplánovaným na později",
  meeting: "Kontakty s domluvenou schůzkou",
  listed: "Úspěšně dokončená část procesu",
  disqualified: "Kontakty vyřazené z dalšího zpracování",
};
