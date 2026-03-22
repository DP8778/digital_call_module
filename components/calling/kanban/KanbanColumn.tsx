import type { ColumnId, ColumnType, Contact } from "../types";
import { isMoveAllowed } from "../allowedMoves";
import { useDroppable } from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import KanbanCard from "./KanbanCard";

type KanbanColumnProps = {
  title: string;
  type: ColumnType;
  contacts: Contact[];
  /** null = žádný drag z boardu */
  dragSourceColumnId: ColumnId | null;
  onMoveContact: (contactId: string, target: ColumnId) => void;
  onRequestSchedule: (contact: Contact, targetColumn: "meeting" | "call_later") => void;
};

function isScheduleSortColumn(t: ColumnType): boolean {
  return t === "call_later" || t === "meeting";
}

function compareBySchedule(a: Contact, b: Contact, now: number): number {
  const sched = (c: Contact) => (typeof c.scheduledAt === "number" ? c.scheduledAt : null);
  const overdue = (c: Contact) => {
    const s = sched(c);
    return s !== null && s < now;
  };
  const oa = overdue(a);
  const ob = overdue(b);
  if (oa !== ob) return oa ? -1 : 1;
  const sa = sched(a) ?? Number.POSITIVE_INFINITY;
  const sb = sched(b) ?? Number.POSITIVE_INFINITY;
  return sa - sb;
}

export default function KanbanColumn({
  title,
  type,
  contacts,
  dragSourceColumnId,
  onMoveContact,
  onRequestSchedule,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: type,
    data: { columnId: type },
  });

  const [listNowMs, setListNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isScheduleSortColumn(type)) return;
    const intervalId = setInterval(() => {
      setListNowMs(Date.now());
    }, 1000);
    return () => clearInterval(intervalId);
  }, [type]);

  const sortedContacts = useMemo(() => {
    if (!isScheduleSortColumn(type)) return contacts;
    return [...contacts].sort((a, b) => compareBySchedule(a, b, listNowMs));
  }, [contacts, type, listNowMs]);

  const isDragActive = dragSourceColumnId !== null;
  const isValidDropTarget =
    dragSourceColumnId !== null && isMoveAllowed(dragSourceColumnId, type);

  const isInvalidDropWhileDragging = isDragActive && !isValidDropTarget;

  const transitionShell =
    "transition-all duration-200 ease-out";

  const shellActiveBase =
    "flex h-full min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900/50";

  const shellInvalidDrag =
    "border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-800";

  const sectionClass = (() => {
    if (!isDragActive) {
      return [shellActiveBase, transitionShell].join(" ");
    }
    if (isValidDropTarget && isOver) {
      return [
        shellActiveBase,
        transitionShell,
        "z-[1] border-emerald-400 bg-emerald-50/60 shadow-md ring-2 ring-emerald-400/70 dark:border-emerald-500 dark:bg-emerald-950/40 dark:ring-emerald-500/50",
      ].join(" ");
    }
    if (isInvalidDropWhileDragging) {
      const invalidBase = [shellInvalidDrag, transitionShell, "z-0"].join(" ");
      if (isOver) {
        return [
          invalidBase,
          "ring-2 ring-gray-300/80 dark:ring-gray-600/80",
        ].join(" ");
      }
      return invalidBase;
    }
    return [shellActiveBase, transitionShell].join(" ");
  })();

  const headerClass = [
    "flex shrink-0 items-center justify-between border-b px-3 py-2 backdrop-blur",
    transitionShell,
    isInvalidDropWhileDragging
      ? "border-gray-200 bg-gray-100/95 dark:border-gray-700 dark:bg-gray-800/95"
      : "border-zinc-200 bg-white/70 dark:border-zinc-600 dark:bg-[#111827]/90",
  ].join(" ");

  const countBadgeClass = [
    "rounded-md border px-2 py-0.5 text-xs font-medium transition-all duration-200",
    isInvalidDropWhileDragging
      ? "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-600 dark:bg-gray-900/50 dark:text-gray-300"
      : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200",
  ].join(" ");

  const titleClass = [
    "text-xs font-semibold uppercase tracking-wide transition-colors duration-200",
    isInvalidDropWhileDragging
      ? "text-gray-600 dark:text-gray-300"
      : "text-zinc-700 dark:text-zinc-200",
  ].join(" ");

  return (
    <section ref={setNodeRef} className={sectionClass}>
      <header className={headerClass}>
        <h3 className={titleClass}>
          {title}
        </h3>
        <span className={countBadgeClass}>
          {contacts.length}
        </span>
      </header>

      <div
        className={[
          "min-h-0 flex-1 overflow-y-auto pl-3 pr-1 pb-2 pt-2",
          "max-lg:max-h-[min(70vh,36rem)] lg:max-h-none",
        ].join(" ")}
      >
        <SortableContext
          items={sortedContacts.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col space-y-2">
            {sortedContacts.map((contact) => (
              <KanbanCard
                key={contact.id}
                contact={contact}
                columnId={type}
                listNowMs={isScheduleSortColumn(type) ? listNowMs : undefined}
                onMoveContact={onMoveContact}
                onRequestSchedule={onRequestSchedule}
              />
            ))}
          </div>
        </SortableContext>
      </div>
    </section>
  );
}
