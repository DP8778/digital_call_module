"use client";

import { ChevronRight, Inbox, RotateCcw } from "lucide-react";
import ActiveFilters from "./ActiveFilters";
import { COLUMN_DESCRIPTION_CS, COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL } from "./labels";
import { formatAttemptCount } from "./queueLogic";
import { getAttemptCount } from "./stateLogic";
import { relativeDayLabel } from "./time";
import type { ColumnId, Contact } from "./types";
import type { QueueFilters } from "./uiState";

const COLUMNS: ColumnId[] = ["backlog", "to_call", "call_later", "meeting", "listed", "disqualified"];

export default function ProcessBoard({ contacts, now, filters, selectedId, onFiltersChange, onOpenContact, onResetDemo }: { contacts: Contact[]; now: number; filters: QueueFilters; selectedId: string | null; onFiltersChange: (filters: QueueFilters) => void; onOpenContact: (contact: Contact) => void; onResetDemo: () => void }) {
  return (
    <div className="mx-auto w-full max-w-7xl overflow-hidden px-4 pb-9 pt-7 sm:px-6 sm:pt-9">
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Přehled procesu</p>
            <h1 id="process-heading" tabIndex={-1} className="dc-text-primary focus-ring mt-1 rounded-lg text-2xl font-bold tracking-[-0.035em] sm:text-[2rem]">Kanban</h1>
            <p className="dc-text-muted mt-1.5 text-sm leading-relaxed">Kontakty uspořádané podle aktuálního procesního stavu.</p>
          </div>
          <button type="button" onClick={onResetDemo} className="button-quiet ml-auto h-9 shrink-0 gap-1.5 px-2 text-xs"><RotateCcw className="size-3.5" aria-hidden="true" />Obnovit demo</button>
        </div>
      </div>
      <section className="queue-control-panel mb-5 grid gap-3 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-8 sm:p-6" aria-label="Souhrn procesu">
        <div>
          <p className="queue-panel-eyebrow">Kontakty v procesu</p>
          <div className="mt-1 flex items-baseline gap-2"><strong className="queue-panel-count">{contacts.length}</strong><span className="queue-panel-caption">celkem v demu</span></div>
        </div>
        <p className="queue-panel-muted max-w-xl text-sm leading-relaxed sm:justify-self-end">Stav kontaktu a termín další aktivity jsou oddělené. Obojí upravíte v detailu kontaktu.</p>
      </section>
      <ActiveFilters filters={filters} onChange={onFiltersChange} />
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0">
      <div className="grid grid-flow-col auto-cols-[minmax(286px,88vw)] items-start gap-4 md:grid-flow-row md:auto-cols-auto md:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = contacts.filter((contact) => contact.status === column);
          return (
            <section key={column} aria-labelledby={`column-${column}`} className="min-w-0">
              <header className="mb-2 min-h-[58px]">
                <div className="flex items-baseline gap-2">
                  <h2 id={`column-${column}`} className="dc-text-primary font-semibold">{COLUMN_LABEL_CS[column]}</h2>
                  <span className="dc-text-muted text-sm font-bold">{items.length}</span>
                </div>
                <p className="dc-text-faint mt-1 text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</p>
              </header>
              <div className="queue-list process-column">
                {items.length === 0 ? (
                  <div className="dc-text-muted px-3 py-8 text-center text-sm">
                    <Inbox className="mx-auto mb-2 size-5" aria-hidden="true" />Zatím bez kontaktů
                  </div>
                ) : items.map((contact, index) => (
                  <button id={`process-contact-${contact.id}`} key={contact.id} type="button" data-selected={selectedId === contact.id} onClick={() => onOpenContact(contact)} className={`contact-row focus-ring group w-full px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--dc-hover)] ${index > 0 ? "border-t border-[var(--dc-border)]" : ""}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0"><div className="dc-text-primary truncate font-semibold">{contact.name}</div><div className="dc-text-muted mt-1 truncate text-sm">{contact.subtype} · {contact.city}</div></div>
                      <span className="row-open-indicator grid size-7 shrink-0 place-items-center rounded-lg" aria-hidden="true"><ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs">
                      <span className="dc-text-primary min-w-0 truncate font-medium">{contact.nextActivity ? `${ACTIVITY_LABEL[contact.nextActivity.type]} · ${relativeDayLabel(contact.nextActivity.dueAt, now)}` : "Bez dalšího termínu"}</span>
                      <span className="dc-text-faint shrink-0">{formatAttemptCount(getAttemptCount(contact))}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      </div>
    </div>
  );
}
