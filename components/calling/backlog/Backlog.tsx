import type { ColumnId, Contact } from "../types";
import { isMoveAllowed } from "../allowedMoves";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import BacklogItem from "./BacklogItem";

type BacklogProps = {
  contacts: Contact[];
  dragSourceColumnId: ColumnId | null;
  onMoveContact: (contactId: string, target: ColumnId) => void;
};

export default function Backlog({
  contacts,
  dragSourceColumnId,
  onMoveContact,
}: BacklogProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: "backlog",
    data: { columnId: "backlog" },
  });

  const isDragActive = dragSourceColumnId !== null;
  const isValidDropTarget =
    dragSourceColumnId !== null && isMoveAllowed(dragSourceColumnId, "backlog");

  const sectionClass = (() => {
    const base =
      "flex h-full min-h-0 min-w-0 flex-1 flex-col bg-white transition-[opacity,box-shadow,background-color] duration-150 dark:bg-[#111827]";
    if (!isDragActive) {
      return base;
    }
    if (isOver && isValidDropTarget) {
      return [
        base,
        "z-[1] bg-emerald-50/50 shadow-md ring-2 ring-inset ring-emerald-400/80 dark:bg-emerald-950/40 dark:ring-emerald-500/60",
      ].join(" ");
    }
    if (isOver && !isValidDropTarget) {
      return [
        base,
        "z-[1] bg-amber-50/40 ring-2 ring-inset ring-amber-400/70 dark:bg-amber-950/35 dark:ring-amber-500/50",
      ].join(" ");
    }
    return [base, "opacity-[0.42] saturate-[0.65]"].join(" ");
  })();

  return (
    <section ref={setNodeRef} className={sectionClass}>
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-[#f9fafb]">Zásobník kontaktů</h2>
        <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
          {contacts.length}
        </span>
      </header>

      <div
        className={[
          "min-h-0 flex-1 overflow-y-auto pl-4 pr-1 pb-4 pt-2",
          "max-lg:max-h-[min(70vh,36rem)] lg:max-h-none",
        ].join(" ")}
      >
        <SortableContext
          items={contacts.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col space-y-2">
            {contacts.map((contact) => (
              <BacklogItem key={contact.id} contact={contact} onMoveContact={onMoveContact} />
            ))}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}
