"use client";

import { AlertCircle, ArrowUpRight, CalendarClock, ChevronDown, ChevronRight, Inbox, PhoneCall, RotateCcw } from "lucide-react";
import { COLUMN_DESCRIPTION_CS, COLUMN_LABEL_CS } from "./allowedMoves";
import { formatAttemptCount, formatCzechCount } from "./queueLogic";
import { getQueuePresentation } from "./queuePresentation";
import { getAttemptCount } from "./stateLogic";
import { formatPragueDateTimePrecise } from "./time";
import type { ColumnId, Contact } from "./types";
import type { QueueFilters } from "./uiState";

const ACTIVE_COLUMNS: ColumnId[] = ["backlog", "to_call", "call_later", "meeting"];
const CLOSED_COLUMNS: ColumnId[] = ["listed", "disqualified"];

function ProcessContactCard({ contact, now, selected, onOpen }: { contact: Contact; now: number; selected: boolean; onOpen: () => void }) {
  const presentation = getQueuePresentation(contact, now);
  const urgencyInk = presentation.kind === "overdue"
    ? "urgency-overdue-ink"
    : presentation.kind === "ready" || presentation.kind === "missing"
      ? "urgency-ready-ink"
      : "dc-text-muted";

  return (
    <button id={`process-contact-${contact.id}`} type="button" data-selected={selected} onClick={onOpen} className="process-contact contact-row focus-ring group w-full p-3.5 text-left">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><div className="dc-text-primary truncate font-semibold" title={contact.name}>{contact.name}</div><div className="dc-text-muted mt-1 truncate text-sm" title={`${contact.subtype} · ${contact.city}`}>{contact.subtype} · {contact.city}</div></div>
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
    </button>
  );
}

export default function ProcessBoard({ contacts, now, filters, selectedId, onOpenContact, onResetDemo, onGoToNew }: { contacts: Contact[]; now: number; filters: QueueFilters; selectedId: string | null; onOpenContact: (contact: Contact) => void; onResetDemo: () => void; onGoToNew: () => void }) {
  const filtersActive = filters.query.trim() !== "" || filters.source !== "all" || filters.status !== "all";

  return (
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

      <p id="process-scroll-hint" className="dc-text-faint mb-2 text-xs xl:hidden">Další stavy zobrazíte vodorovným posunutím →</p>
      <div role="region" aria-label="Aktivní procesní stavy" aria-describedby="process-scroll-hint" tabIndex={0} onKeyDown={(event) => { if (event.target !== event.currentTarget || (event.key !== "ArrowRight" && event.key !== "ArrowLeft")) return; event.preventDefault(); event.currentTarget.scrollBy({ left: event.key === "ArrowRight" ? 302 : -302 }); }} className="focus-ring -mx-4 overflow-x-auto overscroll-x-contain px-4 pb-3 sm:-mx-6 sm:px-6 xl:mx-0 xl:px-0">
        <div className="grid w-full min-w-[1192px] grid-cols-4 items-start gap-4">
          {ACTIVE_COLUMNS.map((column) => {
            const items = contacts.filter((contact) => contact.status === column);
            return (
              <section key={column} aria-labelledby={`column-${column}`} className="process-column min-w-0 overflow-hidden">
                <header className="process-column-header carbon-surface min-h-[106px] p-3.5">
                  <div className="flex items-center justify-between gap-2"><h2 id={`column-${column}`} className="text-sm font-bold text-white">{COLUMN_LABEL_CS[column]}</h2><span className="carbon-count rounded-lg px-2.5 py-1 text-xs font-bold text-white">{items.length}</span></div>
                  <p className="carbon-muted mt-1.5 text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</p>
                  {column === "backlog" ? <button type="button" onClick={onGoToNew} className="carbon-link focus-ring mt-2 inline-flex items-center gap-1 text-xs font-semibold">Prohlédnout nové <ArrowUpRight className="size-3.5" aria-hidden="true" /></button> : null}
                </header>
                <div className="space-y-2 p-3">
                  {items.length === 0 ? <div className="dc-text-muted rounded-[var(--dc-radius)] border border-dashed border-[var(--dc-border)] bg-[var(--dc-surface)] px-3 py-8 text-center text-sm"><Inbox className="mx-auto mb-2 size-5" aria-hidden="true" />Zatím bez kontaktů</div> : items.map((contact) => <ProcessContactCard key={contact.id} contact={contact} now={now} selected={selectedId === contact.id} onOpen={() => onOpenContact(contact)} />)}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <section aria-labelledby="closed-process-heading" className="mt-7">
        <h2 id="closed-process-heading" className="dc-text-primary mb-3 font-semibold">Uzavřené případy</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {CLOSED_COLUMNS.map((column) => {
            const items = contacts.filter((contact) => contact.status === column);
            return (
              <details key={column} className="process-closed">
                <summary className="focus-ring flex cursor-pointer items-center justify-between gap-3 p-4">
                  <span className="min-w-0"><span className="flex items-baseline gap-2"><span className="dc-text-primary font-semibold">{COLUMN_LABEL_CS[column]}</span><span className="dc-text-muted text-sm font-bold">{items.length}</span></span><span className="dc-text-faint mt-0.5 block text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</span></span>
                  <span className="row-open-indicator grid size-7 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ChevronDown className="process-closed-chevron size-4 transition-transform" /></span>
                </summary>
                <div className="grid gap-2 px-3 pb-3">
                  {items.length === 0 ? <p className="dc-text-muted py-4 text-center text-sm">Zatím bez kontaktů</p> : items.map((contact) => <ProcessContactCard key={contact.id} contact={contact} now={now} selected={selectedId === contact.id} onOpen={() => onOpenContact(contact)} />)}
                </div>
              </details>
            );
          })}
        </div>
      </section>
    </div>
  );
}
