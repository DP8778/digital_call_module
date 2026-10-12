"use client";

import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, Mail, MapPin, Phone, PhoneCall, Play } from "lucide-react";
import AccessibleModal from "./AccessibleModal";
import { allowedMoves, COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL, SOURCE_LABEL, TYPE_LABEL } from "./labels";
import { formatAttemptCount, getAttentionReason, getQueueGroup } from "./queueLogic";
import { getAttemptCount } from "./stateLogic";
import StatusPill from "./StatusPill";
import { formatPragueDateTime, formatPragueDateTimePrecise, relativeDayLabel } from "./time";
import type { ActionFeedback, ColumnId, Contact } from "./types";

export default function ContactDetail({
  contact,
  now,
  active,
  feedback,
  onClose,
  onBackToQueue,
  onDismissFeedback,
  onMove,
  onRecordOutcome,
  onSchedule,
}: {
  contact: Contact;
  now: number;
  active: boolean;
  feedback: ActionFeedback | null;
  onClose: () => void;
  onBackToQueue: () => void;
  onDismissFeedback: () => void;
  onMove: (target: ColumnId) => void;
  onRecordOutcome: () => void;
  onSchedule: () => void;
}) {
  const attempts = getAttemptCount(contact);
  const queueGroup = getQueueGroup(contact, now);
  const activityOverdue = Boolean(contact.nextActivity && contact.nextActivity.dueAt < now);
  const isTerminal = contact.status === "listed" || contact.status === "disqualified";
  const history = [...contact.history].sort((a, b) => b.at - a.at);
  const lastInteraction = history.find((entry) => entry.type === "call_attempt") ?? history[0];
  const primaryMoveTarget: ColumnId | null = contact.status === "backlog" || contact.status === "call_later"
    ? "to_call"
    : contact.status === "meeting"
      ? "listed"
      : null;
  const moves = allowedMoves[contact.status].filter((target) => {
    if (target === primaryMoveTarget) return false;
    if (target === "call_later") return contact.nextActivity?.type === "call";
    if (target === "meeting") return contact.nextActivity?.type === "meeting";
    return true;
  });

  const primaryAction = contact.status === "to_call"
    ? { label: "Zaznamenat výsledek hovoru", icon: PhoneCall, action: onRecordOutcome }
    : contact.status === "backlog"
      ? { label: "Začít řešit kontakt", icon: Play, action: () => onMove("to_call") }
      : contact.status === "call_later"
        ? { label: "Přejít k hovoru nyní", icon: PhoneCall, action: () => onMove("to_call") }
        : contact.status === "meeting"
          ? { label: "Označit jako nabranou nemovitost", icon: CheckCircle2, action: () => onMove("listed") }
        : null;
  const PrimaryIcon = primaryAction?.icon;

  return (
    <AccessibleModal title={contact.name} description={`${contact.subtype} · ${contact.city}`} onClose={onClose} size="lg" active={active}>
      <div className="p-5 sm:p-6">
        {feedback ? (
          <section role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" /><div className="min-w-0 flex-1"><h3 className="font-semibold">{feedback.title}</h3><p className="mt-1 text-sm text-emerald-900">{feedback.description}</p>{feedback.nextStep ? <p className="mt-1 text-sm font-medium text-emerald-950">Další krok: {feedback.nextStep}</p> : null}</div></div>
            <div className="mt-4 flex flex-wrap gap-2 pl-8"><button type="button" onClick={onBackToQueue} className="focus-ring inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-800 px-3 text-sm font-semibold text-white hover:bg-emerald-900"><ArrowLeft className="size-4" aria-hidden="true" />Zpět do fronty</button><button type="button" onClick={onDismissFeedback} className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">Zůstat v detailu</button></div>
          </section>
        ) : null}

        <section aria-labelledby="attention-heading" className={`rounded-2xl border p-4 ${queueGroup === "missed" ? "border-rose-200 bg-rose-50" : isTerminal ? "border-slate-200 bg-slate-50" : "border-teal-200 bg-teal-50"}`}>
          <div className="flex flex-wrap items-center gap-2"><StatusPill status={contact.status} /><span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Proč teď?</span></div>
          <h3 id="attention-heading" className={`mt-3 text-lg font-semibold ${queueGroup === "missed" ? "text-rose-950" : "text-slate-950"}`}>{getAttentionReason(contact, now)}</h3>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(240px,.75fr)]">
          <div className="space-y-6">
            <section aria-labelledby="context-heading">
              <h3 id="context-heading" className="text-sm font-semibold text-slate-950">Kontext před akcí</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nemovitost</div><div className="mt-2 font-semibold text-slate-950">{contact.subtype}</div><div className="mt-1 text-sm text-slate-600">{TYPE_LABEL[contact.type]} · {contact.city} · {SOURCE_LABEL[contact.source]}</div></div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Poslední interakce</div><div className="mt-2 font-semibold text-slate-950">{lastInteraction?.label ?? "Zatím bez interakce"}</div>{lastInteraction ? <div className="mt-1 text-sm text-slate-600">{formatPragueDateTime(lastInteraction.at)}</div> : null}{lastInteraction?.note ? <p className="mt-2 text-sm leading-relaxed text-slate-700">{lastInteraction.note}</p> : null}</div>
              </div>
            </section>

            {primaryAction && PrimaryIcon ? (
              <section aria-labelledby="primary-action-heading">
                <h3 id="primary-action-heading" className="text-sm font-semibold text-slate-950">Hlavní akce</h3>
                <button type="button" onClick={primaryAction.action} className="button-primary mt-3 h-auto w-full justify-center py-3 sm:w-auto sm:justify-start"><PrimaryIcon className="size-4" aria-hidden="true" />{primaryAction.label}</button>
              </section>
            ) : null}

            <section aria-labelledby="next-step-heading">
              <div className="flex items-center justify-between gap-3"><h3 id="next-step-heading" className="text-sm font-semibold text-slate-950">Příští krok</h3>{!isTerminal ? <button type="button" onClick={onSchedule} className="focus-ring rounded-lg px-2 py-1 text-sm font-semibold text-teal-700 hover:bg-teal-50">{contact.nextActivity ? "Upravit termín" : "Naplánovat aktivitu"}</button> : null}</div>
              {isTerminal ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">Proces je uzavřený. V tomto stavu nelze plánovat novou aktivitu.</div>
              ) : contact.nextActivity ? (
                <div className={`mt-3 flex gap-3 rounded-2xl border p-4 ${activityOverdue ? "border-rose-200 bg-rose-50" : "border-teal-200 bg-teal-50"}`}><CalendarClock className={`mt-0.5 size-5 shrink-0 ${activityOverdue ? "text-rose-700" : "text-teal-700"}`} aria-hidden="true" /><div><div className={`font-semibold ${activityOverdue ? "text-rose-900" : "text-teal-950"}`}>{activityOverdue ? "Po termínu · " : ""}{ACTIVITY_LABEL[contact.nextActivity.type]}</div><div className={`mt-1 text-sm ${activityOverdue ? "text-rose-800" : "text-teal-800"}`}>{relativeDayLabel(contact.nextActivity.dueAt, now)} · {formatPragueDateTimePrecise(contact.nextActivity.dueAt)}</div></div></div>
              ) : (
                <div className="mt-3 rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Kontakt nemá naplánovanou příští aktivitu.</div>
              )}
            </section>

            <details className="rounded-2xl border border-slate-200 bg-slate-50">
              <summary className="focus-ring cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold text-slate-900">Úplné kontaktní údaje</summary>
              <dl className="grid gap-4 border-t border-slate-200 p-4 sm:grid-cols-2">
                <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Phone className="size-3.5" aria-hidden="true" />Telefon</dt><dd className="mt-1 font-medium text-slate-900">{contact.phone}</dd><dd className="mt-0.5 text-xs text-slate-500">Syntetický, nelze vytáčet</dd></div>
                <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><Mail className="size-3.5" aria-hidden="true" />E-mail</dt><dd className="mt-1 break-all font-medium text-slate-900">{contact.email}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500"><MapPin className="size-3.5" aria-hidden="true" />Lokalita</dt><dd className="mt-1 font-medium text-slate-900">{contact.city}</dd></div>
                <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Evidence</dt><dd className="mt-1 font-medium text-slate-900">{formatAttemptCount(attempts)} · od {formatPragueDateTime(contact.createdAt)}</dd></div>
              </dl>
            </details>

            <section aria-labelledby="history-heading">
              <h3 id="history-heading" className="text-sm font-semibold text-slate-950">Historie</h3>
              <ol className="mt-3">
                {history.map((entry, index) => (
                  <li key={entry.id} className="relative grid grid-cols-[20px_1fr] gap-3 pb-5 last:pb-0">{index < history.length - 1 ? <span className="absolute left-[9px] top-5 h-[calc(100%-10px)] w-px bg-slate-200" aria-hidden="true" /> : null}<span className="relative mt-1 grid size-5 place-items-center rounded-full border border-slate-300 bg-white"><span className="size-1.5 rounded-full bg-teal-600" /></span><div><div className="text-sm font-medium text-slate-900">{entry.label}</div><div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Clock3 className="size-3" aria-hidden="true" />{formatPragueDateTime(entry.at)}</div>{entry.note ? <p className="mt-2 rounded-xl bg-slate-100 px-3 py-2 text-sm leading-relaxed text-slate-700">{entry.note}</p> : null}</div></li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-5 rounded-2xl bg-slate-50 p-4 lg:self-start">
            <section aria-labelledby="status-actions-heading">
              <h3 id="status-actions-heading" className="text-sm font-semibold text-slate-950">Povolená změna stavu</h3>
              {moves.length > 0 ? <div className="mt-3 grid gap-2">{moves.map((target) => <button key={target} type="button" onClick={() => onMove(target)} className="focus-ring rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 hover:border-teal-300 hover:bg-teal-50">Přesunout do „{COLUMN_LABEL_CS[target]}“</button>)}</div> : <p className="mt-2 text-sm leading-relaxed text-slate-500">{isTerminal ? "Tento stav je koncový. Kontakt zůstává dohledatelný v Kanbanu." : "Hlavní povolený krok je dostupný výše v detailu."}</p>}
            </section>
            <div className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">Demo neuskutečňuje hovory ani neposílá e-maily. Všechna data jsou syntetická a uložená pouze v tomto prohlížeči.</div>
          </aside>
        </div>
      </div>
    </AccessibleModal>
  );
}
