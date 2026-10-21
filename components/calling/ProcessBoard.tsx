"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardCode,
  KeyboardSensor,
  MeasuringStrategy,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { AlertCircle, ArrowUpRight, CalendarClock, ChevronDown, ChevronRight, GripVertical, Inbox, MoveRight, PhoneCall, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { allowedMoves, COLUMN_DESCRIPTION_CS, COLUMN_LABEL_CS, isMoveAllowed } from "./allowedMoves";
import { formatAttemptCount, formatCzechCount } from "./queueLogic";
import { getQueuePresentation } from "./queuePresentation";
import { createContactMoveDraft, getAttemptCount } from "./stateLogic";
import { formatPragueDateTimePrecise } from "./time";
import type { ColumnId, Contact, ContactMoveDraft } from "./types";
import type { QueueFilters } from "./uiState";

const ACTIVE_COLUMNS: ColumnId[] = ["backlog", "to_call", "call_later", "meeting"];
const CLOSED_COLUMNS: ColumnId[] = ["listed", "disqualified"];
const ALL_COLUMNS: ColumnId[] = [...ACTIVE_COLUMNS, ...CLOSED_COLUMNS];

function dropId(column: ColumnId): string {
  return `process-drop-${column}`;
}

function handleId(contactId: string): string {
  return `process-drag-handle-${contactId}`;
}

const processKeyboardCoordinates: KeyboardCoordinateGetter = (event, { active, currentCoordinates, context }) => {
  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.code)) return undefined;
  const source = /^process-contact-drag-(backlog|to_call|call_later|meeting|listed|disqualified)-/.exec(String(active))?.[1] as ColumnId | undefined;
  const allowedTargets = source ? allowedMoves[source] : [];
  if (allowedTargets.length === 0) return undefined;
  const ordered = ALL_COLUMNS.filter((column) => allowedTargets.includes(column));
  const current = context.over?.data.current?.column as ColumnId | undefined;
  const currentIndex = current ? ordered.indexOf(current) : -1;
  const direction = event.code === "ArrowLeft" || event.code === "ArrowUp" ? -1 : 1;
  const target = currentIndex < 0
    ? (direction > 0 ? ordered[0] : ordered[ordered.length - 1])
    : ordered[(currentIndex + direction + ordered.length) % ordered.length];
  const rect = context.droppableRects.get(dropId(target));
  const collisionRect = context.collisionRect;
  if (!rect || !collisionRect) return currentCoordinates;
  return {
    x: rect.left + rect.width / 2 - collisionRect.width / 2,
    y: rect.top + Math.min(rect.height / 2, 90) - collisionRect.height / 2,
  };
};

const processCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  if (args.pointerCoordinates) return pointerCollisions;
  return rectIntersection(args);
};

function ContactCardContent({ contact, now }: { contact: Contact; now: number }) {
  const presentation = getQueuePresentation(contact, now);
  const urgencyInk = presentation.kind === "overdue"
    ? "urgency-overdue-ink"
    : presentation.kind === "ready" || presentation.kind === "missing"
      ? "urgency-ready-ink"
      : "dc-text-muted";

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="dc-text-primary dc-wrap-anywhere font-semibold">{contact.name}</div><div className="dc-text-muted dc-wrap-anywhere mt-1 text-sm">{contact.subtype} · {contact.city}</div></div>
        <span className="row-open-indicator grid size-7 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
      </div>
      <div className="mt-3 pt-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs">
          <span className="dc-text-primary font-semibold">{presentation.activity}</span>
          {presentation.dueAt !== null ? <time dateTime={new Date(presentation.dueAt).toISOString()} className="dc-text-muted font-medium">{formatPragueDateTimePrecise(presentation.dueAt)}</time> : null}
        </div>
        <div className="mt-1 flex min-h-4 items-center justify-between gap-2 text-xs">
          {presentation.badge && presentation.kind !== "today" ? <span className={`queue-urgency-label ${urgencyInk}`}>{presentation.kind === "overdue" ? <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> : presentation.kind === "ready" ? <PhoneCall className="size-3.5 shrink-0" aria-hidden="true" /> : presentation.kind === "missing" ? <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" /> : null}{presentation.badge}</span> : <span />}
          <span className="dc-text-faint shrink-0">{formatAttemptCount(getAttemptCount(contact))}</span>
        </div>
      </div>
    </>
  );
}

function MoveMenu({ contact, onChoose }: { contact: Contact; onChoose: (target: ColumnId) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const targets = allowedMoves[contact.status];

  return (
    <div ref={rootRef} className="relative" onBlur={(event) => { if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false); }}>
      <button type="button" aria-expanded={open} aria-haspopup="menu" onClick={() => setOpen((current) => !current)} className="process-move-menu-button focus-ring inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold">
        <MoveRight className="size-4" aria-hidden="true" />Přesunout do…
      </button>
      {open ? (
        <div role="menu" aria-label={`Přesunout kontakt ${contact.name}`} className="process-move-menu absolute bottom-full right-0 z-30 mb-1 min-w-52 rounded-xl border p-1.5 shadow-xl">
          {targets.map((target) => <button key={target} type="button" role="menuitem" onClick={() => { setOpen(false); onChoose(target); }} className="focus-ring block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-[var(--dc-hover)]">{COLUMN_LABEL_CS[target]}</button>)}
        </div>
      ) : null}
    </div>
  );
}

function ProcessContactCard({ contact, now, selected, onOpen, onRequestMove }: { contact: Contact; now: number; selected: boolean; onOpen: () => void; onRequestMove: (target: ColumnId) => void }) {
  const terminal = allowedMoves[contact.status].length === 0;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `process-contact-drag-${contact.status}-${contact.id}`,
    disabled: terminal,
    data: { contact, allowedTargets: allowedMoves[contact.status] },
  });

  return (
    <article ref={setNodeRef} data-selected={selected} data-dragging={isDragging} className="process-contact contact-row group relative min-w-0">
      <button id={`process-contact-${contact.id}`} type="button" onClick={onOpen} className="process-contact-open focus-ring block w-full p-3.5 pb-2 text-left">
        <ContactCardContent contact={contact} now={now} />
      </button>
      {!terminal ? (
        <div className="process-contact-actions flex items-center justify-between gap-1 border-t px-2 py-1.5">
          <button
            id={handleId(contact.id)}
            ref={setActivatorNodeRef}
            type="button"
            className="process-drag-handle focus-ring inline-flex size-11 shrink-0 cursor-grab items-center justify-center rounded-lg active:cursor-grabbing"
            aria-label={`Přesunout kontakt ${contact.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-5" aria-hidden="true" />
          </button>
          <MoveMenu contact={contact} onChoose={onRequestMove} />
        </div>
      ) : null}
    </article>
  );
}

function dropState(active: Contact | null, overColumn: ColumnId | null, column: ColumnId): string | undefined {
  if (!active) return undefined;
  const over = overColumn === column;
  const allowed = isMoveAllowed(active.status, column);
  if (over) return allowed ? "focused-valid" : "focused-invalid";
  return allowed ? "allowed" : "dimmed";
}

function DropMessage({ active, overColumn, column }: { active: Contact | null; overColumn: ColumnId | null; column: ColumnId }) {
  if (!active) return null;
  const over = overColumn === column;
  if (over && !isMoveAllowed(active.status, column)) return <span className="process-drop-label" role="status">Tento přesun není povolen</span>;
  if (over) return <span className="process-drop-label" role="status">Pustit do {COLUMN_LABEL_CS[column]}</span>;
  if (isMoveAllowed(active.status, column)) return <span className="process-drop-label">Lze přesunout</span>;
  return null;
}

function ProcessColumn({ column, items, active, overColumn, now, selectedId, onOpenContact, onRequestMove, onGoToNew }: { column: ColumnId; items: Contact[]; active: Contact | null; overColumn: ColumnId | null; now: number; selectedId: string | null; onOpenContact: (contact: Contact) => void; onRequestMove: (contact: Contact, target: ColumnId) => void; onGoToNew: () => void }) {
  const { setNodeRef } = useDroppable({ id: dropId(column), data: { column } });
  return (
    <section ref={setNodeRef} aria-labelledby={`column-${column}`} data-drop-state={dropState(active, overColumn, column)} className="process-column process-drop-zone min-w-0">
      <header className="process-column-header carbon-surface min-h-[106px] p-3.5">
        <div className="flex items-center justify-between gap-2"><h2 id={`column-${column}`} className="text-sm font-bold text-white">{COLUMN_LABEL_CS[column]}</h2><span className="carbon-count rounded-lg px-2.5 py-1 text-xs font-bold text-white">{items.length}</span></div>
        <p className="carbon-muted mt-1.5 text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</p>
        {column === "backlog" ? <button type="button" onClick={onGoToNew} className="carbon-link focus-ring mt-2 inline-flex items-center gap-1 text-xs font-semibold">Prohlédnout nové <ArrowUpRight className="size-3.5" aria-hidden="true" /></button> : null}
      </header>
      <div className="process-column-body relative min-h-44 space-y-2 p-3">
        <DropMessage active={active} overColumn={overColumn} column={column} />
        {items.length === 0 ? <div className="dc-text-muted rounded-[var(--dc-radius)] border border-dashed border-[var(--dc-border)] bg-[var(--dc-surface)] px-3 py-8 text-center text-sm"><Inbox className="mx-auto mb-2 size-5" aria-hidden="true" />Zatím bez kontaktů</div> : items.map((contact) => <ProcessContactCard key={contact.id} contact={contact} now={now} selected={selectedId === contact.id} onOpen={() => onOpenContact(contact)} onRequestMove={(target) => onRequestMove(contact, target)} />)}
      </div>
    </section>
  );
}

function CompactDropZone({ column, active, overColumn }: { column: ColumnId; active: Contact; overColumn: ColumnId | null }) {
  const { setNodeRef } = useDroppable({ id: dropId(column), data: { column } });
  return (
    <div ref={setNodeRef} data-drop-state={dropState(active, overColumn, column)} className="process-compact-drop process-drop-zone min-h-20 rounded-[var(--dc-radius-lg)] border p-3">
      <div className="flex items-center justify-between gap-3"><strong className="dc-text-primary text-sm">{COLUMN_LABEL_CS[column]}</strong><DropMessage active={active} overColumn={overColumn} column={column} /></div>
      <p className="dc-text-muted mt-1 text-xs">{COLUMN_DESCRIPTION_CS[column]}</p>
    </div>
  );
}

export default function ProcessBoard({ contacts, now, filters, selectedId, onOpenContact, onRequestMove, onResetDemo, onGoToNew }: { contacts: Contact[]; now: number; filters: QueueFilters; selectedId: string | null; onOpenContact: (contact: Contact) => void; onRequestMove: (draft: ContactMoveDraft, focusId: string) => void; onResetDemo: () => void; onGoToNew: () => void }) {
  const filtersActive = filters.query.trim() !== "" || filters.source !== "all" || filters.status !== "all";
  const [activeContact, setActiveContact] = useState<Contact | null>(null);
  const [overColumn, setOverColumn] = useState<ColumnId | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: processKeyboardCoordinates,
      keyboardCodes: {
        start: [KeyboardCode.Space, KeyboardCode.Enter],
        cancel: [KeyboardCode.Esc],
        end: [KeyboardCode.Space, KeyboardCode.Enter],
      },
    }),
  );

  function restoreHandle(contactId: string) {
    window.requestAnimationFrame(() => document.getElementById(handleId(contactId))?.focus());
  }

  function prepareMove(contact: Contact, target: ColumnId) {
    const draft = createContactMoveDraft(contact, target);
    if (draft) onRequestMove(draft, handleId(contact.id));
  }

  function handleDragStart(event: DragStartEvent) {
    const contact = event.active.data.current?.contact as Contact | undefined;
    if (contact) setActiveContact(contact);
  }

  function handleDragOver(event: DragOverEvent) {
    setOverColumn((event.over?.data.current?.column as ColumnId | undefined) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const contact = event.active.data.current?.contact as Contact | undefined;
    const target = event.over?.data.current?.column as ColumnId | undefined;
    setActiveContact(null);
    setOverColumn(null);
    if (contact && target && isMoveAllowed(contact.status, target)) prepareMove(contact, target);
    else if (contact) restoreHandle(contact.id);
  }

  function handleDragCancel() {
    const contactId = activeContact?.id;
    setActiveContact(null);
    setOverColumn(null);
    if (contactId) restoreHandle(contactId);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={processCollisionDetection}
      measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
      autoScroll={{ threshold: { x: 0.15, y: 0.15 }, acceleration: 10, interval: 10 }}
      accessibility={{
        restoreFocus: true,
        screenReaderInstructions: { draggable: "Stiskněte mezerník nebo Enter pro uchopení. Šipkami vyberte povolený cíl, mezerníkem nebo Enterem jej potvrďte a klávesou Escape tažení zrušte." },
        announcements: {
          onDragStart: ({ active }) => { const contact = active.data.current?.contact as Contact | undefined; return contact ? `${contact.name} uchopen. Dostupné cíle: ${allowedMoves[contact.status].map((column) => COLUMN_LABEL_CS[column]).join(", ")}.` : undefined; },
          onDragOver: ({ active, over }) => { const contact = active.data.current?.contact as Contact | undefined; const column = over?.data.current?.column as ColumnId | undefined; if (!contact || !column) return "Mimo cílové sloupce."; return isMoveAllowed(contact.status, column) ? `Vybrán cíl ${COLUMN_LABEL_CS[column]}.` : `${COLUMN_LABEL_CS[column]}. Tento přesun není povolen.`; },
          onDragEnd: ({ active, over }) => { const contact = active.data.current?.contact as Contact | undefined; const column = over?.data.current?.column as ColumnId | undefined; return contact && column && isMoveAllowed(contact.status, column) ? `Otevřen dialog pro přesun kontaktu ${contact.name} do stavu ${COLUMN_LABEL_CS[column]}.` : "Přesun zrušen, data se nezměnila."; },
          onDragCancel: () => "Tažení zrušeno, data se nezměnila.",
        },
      }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="mx-auto w-full max-w-7xl px-4 pb-9 pt-7 sm:px-6 sm:pt-9">
        <div className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="eyebrow">Přehled procesu</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-3"><h1 id="process-heading" tabIndex={-1} className="dc-text-primary focus-ring rounded-lg text-2xl font-bold tracking-[-0.035em] sm:text-[2rem]">Kanban</h1><span className="tone-neutral rounded-full border px-2.5 py-1 text-xs font-semibold">{formatCzechCount(contacts.length, ["kontakt", "kontakty", "kontaktů"])}</span></div>
              <p className="dc-text-muted mt-1.5 text-sm leading-relaxed">Kontakty uspořádané podle aktuálního procesního stavu.</p>
            </div>
            <button type="button" onClick={onResetDemo} className="button-quiet ml-auto h-9 shrink-0 gap-1.5 px-2 text-xs"><RotateCcw className="size-3.5" aria-hidden="true" />Obnovit demo</button>
          </div>
        </div>

        {filtersActive ? <p className="dc-text-muted mb-4 text-xs">Zobrazeny všechny kontakty; filtry platí pro K řešení.</p> : null}

        {activeContact && CLOSED_COLUMNS.some((column) => isMoveAllowed(activeContact.status, column)) ? (
          <section aria-label="Dostupné uzavřené cíle" className="mb-3 grid gap-3 sm:grid-cols-2">
            {CLOSED_COLUMNS.filter((column) => isMoveAllowed(activeContact.status, column)).map((column) => <CompactDropZone key={column} column={column} active={activeContact} overColumn={overColumn} />)}
          </section>
        ) : null}

        <p id="process-scroll-hint" className="dc-text-faint mb-2 text-xs xl:hidden">Další stavy zobrazíte vodorovným posunutím →</p>
        <div role="region" aria-label="Aktivní procesní stavy" aria-describedby="process-scroll-hint" tabIndex={0} onKeyDown={(event) => { if (activeContact || event.target !== event.currentTarget || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return; event.preventDefault(); event.currentTarget.scrollBy({ left: event.key === "ArrowRight" ? 302 : -302 }); }} className="focus-ring -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:px-6 xl:mx-0 xl:px-0">
          <div className="grid w-full min-w-[1192px] grid-cols-4 items-stretch gap-4">
            {ACTIVE_COLUMNS.map((column) => <ProcessColumn key={column} column={column} items={contacts.filter((contact) => contact.status === column)} active={activeContact} overColumn={overColumn} now={now} selectedId={selectedId} onOpenContact={onOpenContact} onRequestMove={prepareMove} onGoToNew={onGoToNew} />)}
          </div>
        </div>

        <section aria-labelledby="closed-process-heading" className="mt-7">
          <h2 id="closed-process-heading" className="dc-text-primary mb-3 font-semibold">Uzavřené případy</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {CLOSED_COLUMNS.map((column) => {
              const items = contacts.filter((contact) => contact.status === column);
              return (
                <details key={column} data-drag-muted={activeContact ? !isMoveAllowed(activeContact.status, column) : undefined} className="process-closed">
                  <summary className="focus-ring flex cursor-pointer items-center justify-between gap-3 p-4">
                    <span className="min-w-0"><span className="flex items-baseline gap-2"><span className="dc-text-primary font-semibold">{COLUMN_LABEL_CS[column]}</span><span className="dc-text-muted text-sm font-bold">{items.length}</span></span><span className="dc-text-faint mt-0.5 block text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</span></span>
                    <span className="row-open-indicator grid size-7 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ChevronDown className="process-closed-chevron size-4 transition-transform" /></span>
                  </summary>
                  <div className="grid gap-2 px-3 pb-3">
                    {items.length === 0 ? <p className="dc-text-muted py-4 text-center text-sm">Zatím bez kontaktů</p> : items.map((contact) => <ProcessContactCard key={contact.id} contact={contact} now={now} selected={selectedId === contact.id} onOpen={() => onOpenContact(contact)} onRequestMove={(target) => prepareMove(contact, target)} />)}
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      </div>

      {typeof document !== "undefined" ? createPortal(
        <DragOverlay dropAnimation={null} zIndex={80}>
          {activeContact ? <div className="process-drag-overlay process-contact pointer-events-none w-[286px] p-3.5" aria-hidden="true"><ContactCardContent contact={activeContact} now={now} /></div> : null}
        </DragOverlay>,
        document.body,
      ) : null}
    </DndContext>
  );
}
