"use client";

import { ArrowUpRight, Inbox } from "lucide-react";
import { COLUMN_DESCRIPTION_CS, COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL } from "./labels";
import { formatAttemptCount } from "./queueLogic";
import { getAttemptCount } from "./stateLogic";
import { relativeDayLabel } from "./time";
import type { ColumnId, Contact } from "./types";

const COLUMNS: ColumnId[] = ["backlog", "to_call", "call_later", "meeting", "listed", "disqualified"];

export default function ProcessBoard({ contacts, now, onOpenContact }: { contacts: Contact[]; now: number; onOpenContact: (contact: Contact) => void }) {
  return (
    <div className="mx-auto w-full max-w-[1500px] overflow-hidden px-4 py-6 sm:px-6 sm:py-9">
      <div className="mb-6">
        <p className="eyebrow">Přehled procesu</p>
        <h1 className="text-main mt-1 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Kanban</h1>
        <p className="text-muted mt-1.5 text-sm leading-relaxed">Stav kontaktu je oddělený od termínu další aktivity. Změny lze provést z detailu bez přetahování.</p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0">
      <div className="grid grid-flow-col auto-cols-[minmax(286px,88vw)] items-start gap-4 md:grid-flow-row md:auto-cols-auto md:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = contacts.filter((contact) => contact.status === column);
          return (
            <section key={column} aria-labelledby={`column-${column}`} className="surface-subtle overflow-hidden rounded-[var(--dc-radius-lg)] border">
              <header className="border-b bg-[var(--dc-surface)] px-4 py-3.5" style={{ borderColor: "var(--dc-border)" }}>
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`column-${column}`} className="text-main font-semibold">{COLUMN_LABEL_CS[column]}</h2>
                  <span className="tone-neutral rounded-full border px-2.5 py-1 text-xs font-semibold">{items.length}</span>
                </div>
                <p className="text-muted mt-1 text-xs leading-relaxed">{COLUMN_DESCRIPTION_CS[column]}</p>
              </header>
              <div className="space-y-2 p-2.5">
                {items.length === 0 ? (
                  <div className="text-muted rounded-xl border border-dashed bg-[var(--dc-surface)] px-3 py-8 text-center text-sm" style={{ borderColor: "var(--dc-border-strong)" }}>
                    <Inbox className="mx-auto mb-2 size-5" aria-hidden="true" />Zatím bez kontaktů
                  </div>
                ) : items.map((contact) => (
                  <button key={contact.id} type="button" onClick={() => onOpenContact(contact)} className="focus-ring group w-full rounded-xl border bg-[var(--dc-surface-elevated)] p-3.5 text-left shadow-sm transition-[border-color,background-color,box-shadow] duration-150 hover:border-[var(--dc-border-strong)] hover:bg-[var(--dc-surface)] hover:shadow-md" style={{ borderColor: "var(--dc-border)" }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="text-main truncate font-semibold">{contact.name}</div><div className="text-muted mt-1 truncate text-sm">{contact.subtype} · {contact.city}</div></div>
                      <ArrowUpRight className="text-faint size-4 shrink-0 group-hover:text-[var(--dc-accent)]" aria-hidden="true" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t pt-3 text-xs" style={{ borderColor: "var(--dc-border)" }}>
                      <span className="text-main min-w-0 truncate font-medium">{contact.nextActivity ? `${ACTIVITY_LABEL[contact.nextActivity.type]} · ${relativeDayLabel(contact.nextActivity.dueAt, now)}` : "Bez dalšího termínu"}</span>
                      <span className="text-faint shrink-0">{formatAttemptCount(getAttemptCount(contact))}</span>
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
