"use client";

import { ArrowUpRight, Inbox, RotateCcw } from "lucide-react";
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
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Přehled procesu</p>
            <h1 id="process-heading" tabIndex={-1} className="dc-text-primary focus-ring mt-1 rounded-lg text-2xl font-bold tracking-[-0.035em] sm:text-[2rem]">Kanban</h1>
            <p className="dc-text-muted mt-1.5 text-sm leading-relaxed">Stav kontaktu je oddělený od termínu další aktivity. Změny lze provést z detailu bez přetahování.</p>
          </div>
          <button type="button" onClick={onResetDemo} className="button-quiet ml-auto h-9 shrink-0 gap-1.5 px-2 text-xs"><RotateCcw className="size-3.5" aria-hidden="true" />Obnovit demo</button>
        </div>
      </div>
      <ActiveFilters filters={filters} onChange={onFiltersChange} />
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0">
      <div className="grid grid-flow-col auto-cols-[minmax(286px,88vw)] items-start gap-4 md:grid-flow-row md:auto-cols-auto md:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = contacts.filter((contact) => contact.status === column);
          return (
            <section key={column} aria-labelledby={`column-${column}`} className="process-column overflow-hidden rounded-[var(--dc-radius-lg)] border">
              <header className="border-b bg-[var(--dc-surface)] px-4 py-3.5" style={{ borderColor: "var(--dc-border)" }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`column-${column}`} className="dc-text-primary font-semibold">{COLUMN_LABEL_CS[column]}</h2>
                  <span className="tone-neutral rounded-full border px-2.5 py-1 text-xs font-semibold">{items.length}</span>
                </div>
                <p className="dc-text-muted mt-1 text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</p>
              </header>
              <div className="space-y-2 p-2.5">
                {items.length === 0 ? (
                  <div className="dc-text-muted rounded-xl border border-dashed bg-[var(--dc-surface)] px-3 py-8 text-center text-sm" style={{ borderColor: "var(--dc-border-strong)" }}>
                    <Inbox className="mx-auto mb-2 size-5" aria-hidden="true" />Zatím bez kontaktů
                  </div>
                ) : items.map((contact) => (
                  <button id={`process-contact-${contact.id}`} key={contact.id} type="button" data-selected={selectedId === contact.id} onClick={() => onOpenContact(contact)} className="process-contact focus-ring group w-full rounded-xl border border-[var(--dc-border)] bg-[var(--dc-surface)] p-3.5 text-left transition-[border-color,background-color] duration-150 hover:border-[var(--dc-border-strong)] hover:bg-[var(--dc-hover)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="dc-text-primary truncate font-semibold">{contact.name}</div><div className="dc-text-muted mt-1 truncate text-sm">{contact.subtype} · {contact.city}</div></div>
                      <ArrowUpRight className="dc-text-faint size-4 shrink-0 group-hover:text-[var(--dc-text)]" aria-hidden="true" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs" style={{ borderColor: "var(--dc-border)" }}>
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
