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
    <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="text-sm font-semibold text-teal-700">Přehled procesu</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Kanban</h1>
        <p className="mt-1 text-sm text-slate-600">Stav kontaktu je oddělený od termínu další aktivity. Změny lze provést z detailu bez přetahování.</p>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        {COLUMNS.map((column) => {
          const items = contacts.filter((contact) => contact.status === column);
          return (
            <section key={column} aria-labelledby={`column-${column}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70">
              <header className="border-b border-slate-200 bg-white px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 id={`column-${column}`} className="font-semibold text-slate-950">{COLUMN_LABEL_CS[column]}</h2>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{items.length}</span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{COLUMN_DESCRIPTION_CS[column]}</p>
              </header>
              <div className="space-y-2 p-2.5">
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-3 py-8 text-center text-sm text-slate-500">
                    <Inbox className="mx-auto mb-2 size-5" aria-hidden="true" />Zatím bez kontaktů
                  </div>
                ) : items.map((contact) => (
                  <button key={contact.id} type="button" onClick={() => onOpenContact(contact)} className="focus-ring group w-full rounded-xl border border-slate-200 bg-white p-3.5 text-left shadow-sm hover:border-slate-300 hover:shadow">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0"><div className="truncate font-semibold text-slate-950">{contact.name}</div><div className="mt-1 truncate text-sm text-slate-500">{contact.subtype} · {contact.city}</div></div>
                      <ArrowUpRight className="size-4 shrink-0 text-slate-400 group-hover:text-teal-700" aria-hidden="true" />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
                      <span className="min-w-0 truncate font-medium text-slate-700">{contact.nextActivity ? `${ACTIVITY_LABEL[contact.nextActivity.type]} · ${relativeDayLabel(contact.nextActivity.dueAt, now)}` : "Bez dalšího termínu"}</span>
                      <span className="shrink-0 text-slate-400">{formatAttemptCount(getAttemptCount(contact))}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
