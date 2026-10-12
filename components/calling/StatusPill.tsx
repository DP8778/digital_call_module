import { COLUMN_LABEL_CS } from "./allowedMoves";
import type { ColumnId } from "./types";

const STYLE: Record<ColumnId, string> = {
  backlog: "tone-neutral",
  to_call: "tone-accent",
  call_later: "tone-warning",
  meeting: "tone-info",
  listed: "tone-success",
  disqualified: "tone-danger",
};

export default function StatusPill({ status }: { status: ColumnId }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLE[status]}`}>
      {COLUMN_LABEL_CS[status]}
    </span>
  );
}
