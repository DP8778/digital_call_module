import { COLUMN_LABEL_CS } from "./allowedMoves";
import type { ColumnId } from "./types";

const STYLE: Record<ColumnId, string> = {
  backlog: "border-slate-200 bg-slate-100 text-slate-700",
  to_call: "border-teal-200 bg-teal-50 text-teal-800",
  call_later: "border-amber-200 bg-amber-50 text-amber-800",
  meeting: "border-blue-200 bg-blue-50 text-blue-800",
  listed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  disqualified: "border-rose-200 bg-rose-50 text-rose-800",
};

export default function StatusPill({ status }: { status: ColumnId }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLE[status]}`}>
      {COLUMN_LABEL_CS[status]}
    </span>
  );
}
