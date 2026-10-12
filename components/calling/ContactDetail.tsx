"use client";

import { CalendarClock, Clock3, Mail, MapPin, Phone, PhoneCall } from "lucide-react";
import AccessibleModal from "./AccessibleModal";
import { allowedMoves, COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL, SOURCE_LABEL, TYPE_LABEL } from "./labels";
import { getAttemptCount } from "./stateLogic";
import StatusPill from "./StatusPill";
import { formatPragueDateTime, relativeDayLabel } from "./time";
import type { ColumnId, Contact } from "./types";

export default function ContactDetail({
  contact,
  now,
  onClose,
  onMove,
  onRecordOutcome,
  onSchedule,
}: {
  contact: Contact;
  now: number;
  onClose: () => void;
  onMove: (target: ColumnId) => void;
  onRecordOutcome: () => void;
  onSchedule: () => void;
}) {
  const attempts = getAttemptCount(contact);
  const activityOverdue = Boolean(contact.nextActivity && contact.nextActivity.dueAt < now);
  const moves = allowedMoves[contact.status].filter((target) => {
    if (target === "call_later") return contact.nextActivity?.type === "call";
    if (target === "meeting") return contact.nextActivity?.type === "meeting";
    return true;
  });

  return (
    <AccessibleModal title={contact.name} description={`${contact.subtype} · ${contact.city}`} onClose={onClose} size="lg">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(260px,.9fr)]">
        <div className="space-y-6 p-5 sm:p-6 lg:border-r lg:border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={contact.status} />
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{SOURCE_LABEL[contact.source]}</span>
            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600">{attempts} {attempts === 1 ? "pokus" : attempts > 1 && attempts < 5 ? "pokusy" : "pokusů"}</span>
          </div>

          <section aria-labelledby="contact-data-heading">
            <h3 id="contact-data-heading" className="text-sm font-semibold text-slate-950">Kontakt a nemovitost</h3>
            <dl className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
              <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Phone className="size-3.5" aria-hidden="true" />Telefon</dt><dd className="mt-1 font-medium text-slate-900">{contact.phone}</dd><dd className="mt-0.5 text-xs text-slate-500">Syntetický, nelze vytáčet</dd></div>
              <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Mail className="size-3.5" aria-hidden="true" />E-mail</dt><dd className="mt-1 break-all font-medium text-slate-900">{contact.email}</dd></div>
              <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><MapPin className="size-3.5" aria-hidden="true" />Lokalita</dt><dd className="mt-1 font-medium text-slate-900">{contact.city}</dd></div>
              <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Záměr</dt><dd className="mt-1 font-medium text-slate-900">{TYPE_LABEL[contact.type]} · {contact.subtype}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="next-step-heading">
            <div className="flex items-center justify-between gap-3"><h3 id="next-step-heading" className="text-sm font-semibold text-slate-950">Příští krok</h3><button type="button" onClick={onSchedule} className="focus-ring rounded-lg px-2 py-1 text-sm font-semibold text-teal-700 hover:bg-teal-50">{contact.nextActivity ? "Upravit" : "Naplánovat"}</button></div>
            {contact.nextActivity ? (
              <div className={`mt-3 flex gap-3 rounded-2xl border p-4 ${activityOverdue ? "border-rose-200 bg-rose-50" : "border-teal-200 bg-teal-50"}`}>
                <CalendarClock className={`mt-0.5 size-5 shrink-0 ${activityOverdue ? "text-rose-700" : "text-teal-700"}`} aria-hidden="true" />
                <div><div className={`font-semibold ${activityOverdue ? "text-rose-900" : "text-teal-950"}`}>{activityOverdue ? "Po termínu · " : ""}{ACTIVITY_LABEL[contact.nextActivity.type]}</div><div className={`mt-1 text-sm ${activityOverdue ? "text-rose-800" : "text-teal-800"}`}>{relativeDayLabel(contact.nextActivity.dueAt, now)} · {formatPragueDateTime(contact.nextActivity.dueAt)}</div></div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Kontakt nemá naplánovaný další krok. Termín lze doplnit bez změny stavu.</div>
            )}
          </section>

          <section aria-labelledby="history-heading">
            <h3 id="history-heading" className="text-sm font-semibold text-slate-950">Historie</h3>
            <ol className="mt-3 space-y-0">
              {[...contact.history].sort((a, b) => b.at - a.at).map((entry, index) => (
                <li key={entry.id} className="relative grid grid-cols-[20px_1fr] gap-3 pb-5 last:pb-0">
                  {index < contact.history.length - 1 ? <span className="absolute left-[9px] top-5 h-[calc(100%-10px)] w-px bg-slate-200" aria-hidden="true" /> : null}
                  <span className="relative mt-1 grid size-5 place-items-center rounded-full border border-slate-300 bg-white"><span className="size-1.5 rounded-full bg-teal-600" /></span>
                  <div><div className="text-sm font-medium text-slate-900">{entry.label}</div><div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="size-3" aria-hidden="true" />{formatPragueDateTime(entry.at)}</div>{entry.note ? <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-700">{entry.note}</p> : null}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-5 bg-slate-50 p-5 sm:p-6">
          <section aria-labelledby="primary-action-heading">
            <h3 id="primary-action-heading" className="text-sm font-semibold text-slate-950">Další akce</h3>
            <div className="mt-3 grid gap-2">
              {contact.status === "to_call" ? <button type="button" onClick={onRecordOutcome} className="button-primary h-auto justify-start py-3"><PhoneCall className="size-4" aria-hidden="true" />Zaznamenat výsledek</button> : null}
              <button type="button" onClick={onSchedule} className="button-secondary h-auto justify-start py-3"><CalendarClock className="size-4" aria-hidden="true" />{contact.nextActivity ? "Upravit termín" : "Naplánovat aktivitu"}</button>
            </div>
            {contact.status !== "to_call" && contact.status !== "listed" && contact.status !== "disqualified" ? <p className="mt-2 text-xs leading-relaxed text-slate-500">Výsledek hovoru lze zapsat po přesunu kontaktu do stavu „K provolání“.</p> : null}
          </section>

          <section aria-labelledby="status-actions-heading" className="border-t border-slate-200 pt-5">
            <h3 id="status-actions-heading" className="text-sm font-semibold text-slate-950">Povolená změna stavu</h3>
            {moves.length > 0 ? <div className="mt-3 grid gap-2">{moves.map((target) => <button key={target} type="button" onClick={() => onMove(target)} className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:border-teal-300 hover:bg-teal-50">Přesunout do „{COLUMN_LABEL_CS[target]}“</button>)}</div> : <p className="mt-2 text-sm leading-relaxed text-slate-500">Tento stav je v demu koncový. Kontakt zůstává dohledatelný v Kanbanu.</p>}
          </section>
          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-500">Demo neuskutečňuje hovory ani neposílá e-maily. Všechna data jsou syntetická a uložená pouze v tomto prohlížeči.</div>
        </aside>
      </div>
    </AccessibleModal>
  );
}
