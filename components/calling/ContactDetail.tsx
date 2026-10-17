"use client";

import { AlertCircle, ArrowLeft, CalendarClock, CheckCircle2, ChevronDown, Clock3, Mail, MapPin, Phone, PhoneCall, Play } from "lucide-react";
import AccessibleModal from "./AccessibleModal";
import { allowedMoves, COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL, SOURCE_LABEL, TYPE_LABEL } from "./labels";
import { formatAttemptCount, getAttentionReason, getQueueGroup } from "./queueLogic";
import { getAttemptCount } from "./stateLogic";
import StatusPill from "./StatusPill";
import { formatContextualPragueDateTime, formatPragueDateTime } from "./time";
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
      <div className="p-4 sm:p-5">
        {feedback ? (
          <section role="status" className="tone-success mb-5 rounded-2xl border p-4">
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden="true" /><div className="min-w-0 flex-1"><h3 className="font-semibold">{feedback.title}</h3><p className="mt-1 text-sm">{feedback.description}</p><div className="mt-2"><StatusPill status={contact.status} /></div>{feedback.nextStep ? <p className="mt-2 text-sm font-semibold">Další krok: {feedback.nextStep}</p> : null}</div></div>
            <div className="mt-4 flex flex-wrap gap-2 pl-8"><button type="button" onClick={onBackToQueue} className="button-secondary h-10 px-3"><ArrowLeft className="size-4" aria-hidden="true" />Zpět do fronty</button><button type="button" onClick={onDismissFeedback} className="button-quiet h-10 px-3">Zůstat v detailu</button></div>
          </section>
        ) : null}

        <section aria-labelledby="attention-heading" className={`rounded-2xl border px-4 py-3.5 ${queueGroup === "missed" ? "tone-danger" : "tone-neutral"}`}>
          <div className="flex flex-wrap items-center gap-2">{queueGroup === "missed" ? <AlertCircle className="size-4" aria-hidden="true" /> : null}<StatusPill status={contact.status} /><span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-80">Proč teď?</span></div>
          <h3 id="attention-heading" className="mt-2 text-base font-semibold sm:text-lg">{getAttentionReason(contact, now)}</h3>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(250px,.65fr)]">
          <div className="space-y-5">
            <section aria-labelledby="context-heading">
              <h3 id="context-heading" className="dc-text-primary text-sm font-semibold">Kontext před akcí</h3>
              <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                <div className="detail-card rounded-2xl border p-3.5"><div className="dc-text-muted text-xs font-semibold uppercase tracking-wide">Nemovitost</div><div className="dc-text-primary mt-1.5 font-semibold">{contact.subtype}</div><div className="dc-text-muted mt-1 text-sm">{TYPE_LABEL[contact.type]} · {contact.city} · {SOURCE_LABEL[contact.source]}</div></div>
                <div className="detail-card rounded-2xl border p-3.5"><div className="dc-text-muted text-xs font-semibold uppercase tracking-wide">Poslední interakce</div><div className="dc-text-primary mt-1.5 font-semibold">{lastInteraction?.label ?? "Zatím bez interakce"}</div>{lastInteraction ? <div className="dc-text-muted mt-1 text-sm">{formatPragueDateTime(lastInteraction.at)}</div> : null}{lastInteraction?.note ? <p className="dc-text-primary mt-2 text-sm leading-relaxed">{lastInteraction.note}</p> : null}</div>
              </div>
            </section>

            {primaryAction && PrimaryIcon && !feedback ? (
              <section aria-labelledby="primary-action-heading">
                <h3 id="primary-action-heading" className="dc-text-primary text-sm font-semibold">Hlavní akce</h3>
                <button type="button" onClick={primaryAction.action} className="button-work mt-2.5 h-auto w-full justify-center px-3 py-2 sm:w-auto sm:justify-start"><span className="button-icon-slot" aria-hidden="true"><PrimaryIcon className="size-5" /></span><span>{primaryAction.label}</span></button>
              </section>
            ) : null}

            <section aria-labelledby="next-step-heading">
              <div className="flex items-center justify-between gap-3"><h3 id="next-step-heading" className="dc-text-primary text-sm font-semibold">Příští krok</h3>{!isTerminal ? <button type="button" onClick={onSchedule} className="button-quiet h-9 px-2">{contact.nextActivity ? "Upravit termín" : "Naplánovat aktivitu"}</button> : null}</div>
              {isTerminal ? (
                <div className="tone-neutral mt-3 rounded-2xl border p-4 text-sm">Proces je uzavřený. V tomto stavu nelze plánovat novou aktivitu.</div>
              ) : contact.nextActivity ? (
                <div className={`next-step-card mt-2.5 flex gap-3 rounded-2xl border p-3.5 ${activityOverdue ? "tone-danger" : "tone-neutral"}`}>{activityOverdue ? <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <CalendarClock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}<div><div className="font-semibold">{activityOverdue ? "Po termínu · " : ""}{ACTIVITY_LABEL[contact.nextActivity.type]}</div><div className="mt-1 text-sm">{formatContextualPragueDateTime(contact.nextActivity.dueAt, now)}</div></div></div>
              ) : (
                <div className="tone-warning mt-3 flex items-center gap-2 rounded-2xl border border-dashed p-4 text-sm"><AlertCircle className="size-4 shrink-0" aria-hidden="true" />Kontakt nemá naplánovanou příští aktivitu.</div>
              )}
            </section>

            <details className="detail-card rounded-2xl border">
              <summary className="focus-ring dc-text-primary cursor-pointer rounded-2xl px-4 py-3 text-sm font-semibold">Úplné kontaktní údaje</summary>
              <dl className="grid gap-4 border-t p-4 sm:grid-cols-2" style={{ borderColor: "var(--dc-border)" }}>
                <div><dt className="dc-text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><Phone className="size-3.5" aria-hidden="true" />Telefon</dt><dd className="dc-text-primary mt-1 font-medium">{contact.phone}</dd><dd className="dc-text-faint mt-0.5 text-xs">Syntetický, nelze vytáčet</dd></div>
                <div><dt className="dc-text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><Mail className="size-3.5" aria-hidden="true" />E-mail</dt><dd className="dc-text-primary mt-1 break-all font-medium">{contact.email}</dd></div>
                <div><dt className="dc-text-muted flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide"><MapPin className="size-3.5" aria-hidden="true" />Lokalita</dt><dd className="dc-text-primary mt-1 font-medium">{contact.city}</dd></div>
                <div><dt className="dc-text-muted text-xs font-medium uppercase tracking-wide">Evidence</dt><dd className="dc-text-primary mt-1 font-medium">{formatAttemptCount(attempts)} · od {formatPragueDateTime(contact.createdAt)}</dd></div>
              </dl>
            </details>

            <section aria-labelledby="history-heading">
              <h3 id="history-heading" className="dc-text-primary text-sm font-semibold">Historie</h3>
              <ol className="mt-3">
                {history.map((entry, index) => (
                  <li key={entry.id} className="relative grid grid-cols-[20px_1fr] gap-3 pb-4 last:pb-0">{index < history.length - 1 ? <span className="absolute left-[9px] top-5 h-[calc(100%-10px)] w-px bg-[var(--dc-border-strong)]" aria-hidden="true" /> : null}<span className="relative mt-1 grid size-5 place-items-center rounded-full border bg-[var(--dc-surface-elevated)]" style={{ borderColor: "var(--dc-border-strong)" }}><span className="size-1.5 rounded-full bg-[var(--dc-text-faint)]" /></span><div><div className="dc-text-primary text-sm font-medium">{entry.label}</div><div className="dc-text-muted mt-0.5 flex items-center gap-1 text-xs"><Clock3 className="size-3" aria-hidden="true" />{formatPragueDateTime(entry.at)}</div>{entry.note ? <p className="surface-subtle dc-text-primary mt-2 rounded-xl px-3 py-2 text-sm leading-relaxed">{entry.note}</p> : null}</div></li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="process-actions space-y-4 rounded-2xl border p-4 lg:self-start">
            {moves.length > 0 ? <details><summary className="focus-ring dc-text-primary flex cursor-pointer list-none items-center justify-between gap-2 rounded-lg text-sm font-semibold [&::-webkit-details-marker]:hidden">Další změny stavu<ChevronDown className="size-4 shrink-0" aria-hidden="true" /></summary><div className="mt-3 grid gap-1">{moves.map((target) => <button key={target} type="button" onClick={() => onMove(target)} className="button-quiet h-auto justify-start px-2 py-2.5 text-left">Přesunout do „{COLUMN_LABEL_CS[target]}“</button>)}</div></details> : <p className="dc-text-muted text-sm leading-relaxed">{isTerminal ? "Tento stav je koncový. Kontakt zůstává dohledatelný v Kanbanu." : "Hlavní povolený krok je dostupný výše v detailu."}</p>}
            <div className="dc-text-muted border-t pt-4 text-xs leading-relaxed" style={{ borderColor: "var(--dc-border)" }}>Demo neuskutečňuje hovory ani neposílá e-maily. Všechna data jsou syntetická a uložená pouze v tomto prohlížeči.</div>
          </aside>
        </div>
      </div>
    </AccessibleModal>
  );
}
