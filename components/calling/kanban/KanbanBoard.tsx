import type { ColumnId, Contact } from "../types";
import KanbanColumn from "./KanbanColumn";

type KanbanBoardProps = {
  columns: Record<ColumnId, Contact[]>;
  dragSourceColumnId: ColumnId | null;
  onMoveContact: (contactId: string, target: ColumnId) => void;
  onRequestSchedule: (contact: Contact, targetColumn: "meeting" | "call_later") => void;
};

/**
 * Desktop 2×2: K provolání | Schůzky / Volat později | Nabrané.
 * Mobil + tablet (<lg): 1 sloupec, 4 řádky ve stejném pořadí.
 */
const MAIN_COLUMNS: { id: Exclude<ColumnId, "backlog" | "disqualified">; title: string }[] = [
  { id: "to_call", title: "Kontakty k provolání" },
  { id: "meeting", title: "Domluvené schůzky" },
  { id: "call_later", title: "Volat později" },
  { id: "listed", title: "Nabrané nemovitosti" },
];

export default function KanbanBoard({
  columns: boardColumns,
  dragSourceColumnId,
  onMoveContact,
  onRequestSchedule,
}: KanbanBoardProps) {
  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="grid h-full min-h-0 w-full grid-cols-1 grid-rows-4 gap-4 lg:grid-cols-2 lg:grid-rows-2">
          {MAIN_COLUMNS.map((column) => (
            <div
              key={column.id}
              className="flex min-h-0 h-full min-w-0 flex-1 flex-col lg:min-h-0"
            >
              <KanbanColumn
                title={column.title}
                type={column.id}
                contacts={boardColumns[column.id]}
                dragSourceColumnId={dragSourceColumnId}
                onMoveContact={onMoveContact}
                onRequestSchedule={onRequestSchedule}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex max-h-[min(28vh,220px)] min-h-[100px] shrink-0 flex-col overflow-hidden">
        <KanbanColumn
          title="Vyřazené kontakty"
          type="disqualified"
          contacts={boardColumns.disqualified}
          dragSourceColumnId={dragSourceColumnId}
          onMoveContact={onMoveContact}
          onRequestSchedule={onRequestSchedule}
        />
      </div>
    </section>
  );
}
