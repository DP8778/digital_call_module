"use client";

import { AlertTriangle, ArrowRight, CalendarClock, Info } from "lucide-react";
import { useId, useRef, useState } from "react";
import AccessibleModal from "./AccessibleModal";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL } from "./labels";
import { addPragueCalendarDays, formatPragueDateTimePrecise, parsePragueDateTime, toPragueDateTimeInput } from "./time";
import type { ActivityType, ContactMoveDraft, ScheduleInput, SubmitResult } from "./types";

function activityText(activity: ContactMoveDraft["expectedNextActivity"]): string {
  return activity
    ? `${ACTIVITY_LABEL[activity.type]} · ${formatPragueDateTimePrecise(activity.dueAt)}`
    : "Žádná další aktivita";
}

function requiredActivity(target: ContactMoveDraft["target"]): ActivityType | null {
  if (target === "call_later") return "call";
  if (target === "meeting") return "meeting";
  return null;
}

function confirmLabel(target: ContactMoveDraft["target"]): string {
  if (target === "call_later") return "Naplánovat hovor a přesunout";
  if (target === "meeting") return "Naplánovat schůzku a přesunout";
  if (target === "to_call") return "Přesunout k provolání";
  if (target === "backlog") return "Přesunout do zásobníku";
  if (target === "listed") return "Potvrdit nabranou nemovitost";
  return "Vyřadit kontakt";
}

export default function MoveConfirmationModal({
  draft,
  now,
  onClose,
  onConfirm,
  onRefreshDraft,
}: {
  draft: ContactMoveDraft;
  now: number;
  onClose: () => void;
  onConfirm: (draft: ContactMoveDraft, activity?: ScheduleInput) => SubmitResult;
  onRefreshDraft: () => boolean;
}) {
  const activityType = requiredActivity(draft.target);
  const reusableActivity = draft.expectedNextActivity?.type === activityType && draft.expectedNextActivity.dueAt > now
    ? draft.expectedNextActivity
    : null;
  const [value, setValue] = useState(() => toPragueDateTimeInput(reusableActivity?.dueAt ?? addPragueCalendarDays(now, 1, 9)));
  const [error, setError] = useState("");
  const [invalidDate, setInvalidDate] = useState(false);
  const [stale, setStale] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const dateId = useId();
  const clearsActivity = draft.target === "backlog" || draft.target === "listed" || draft.target === "disqualified";

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submittingRef.current) return;
    let activity: ScheduleInput | undefined;
    if (activityType) {
      const submittedAt = Date.now();
      const dueAt = parsePragueDateTime(value);
      if (!dueAt || dueAt <= submittedAt) {
        setInvalidDate(true);
        setError("Zadejte platný budoucí termín v časovém pásmu Europe/Prague.");
        return;
      }
      activity = { activityType, dueAt };
    }
    submittingRef.current = true;
    setSubmitting(true);
    const result = onConfirm(draft, activity);
    if (result.accepted) {
      onClose();
      return;
    }
    submittingRef.current = false;
    setSubmitting(false);
    setStale(result.reason === "stale");
    setInvalidDate(result.reason === "expired");
    setError(result.message);
  }

  const oldActivity = activityText(draft.expectedNextActivity);
  const warningTone = draft.target === "disqualified" ? "tone-danger" : clearsActivity ? "tone-warning" : "tone-info";

  return (
    <AccessibleModal
      title="Potvrdit přesun kontaktu"
      description={`Kontakt: ${draft.contactName}`}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-[var(--dc-border)] bg-[var(--dc-surface-subtle)] p-4 text-center">
          <div><span className="dc-text-faint block text-xs font-semibold uppercase tracking-wide">Z</span><strong className="dc-text-primary mt-1 block text-sm">{COLUMN_LABEL_CS[draft.source]}</strong></div>
          <ArrowRight className="dc-text-muted size-5" aria-hidden="true" />
          <div><span className="dc-text-faint block text-xs font-semibold uppercase tracking-wide">Do</span><strong className="dc-text-primary mt-1 block text-sm">{COLUMN_LABEL_CS[draft.target]}</strong></div>
        </div>

        {activityType ? (
          <div className="space-y-4">
            <div className="tone-info flex items-start gap-3 rounded-2xl border p-4">
              <CalendarClock className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="font-semibold">Nový další krok: {ACTIVITY_LABEL[activityType]}</h3>
                {draft.expectedNextActivity ? (
                  reusableActivity && value === toPragueDateTimeInput(reusableActivity.dueAt)
                    ? <p className="mt-1 text-sm leading-relaxed">Existující budoucí termín je předvyplněný a zůstane zachován, pokud jej nezměníte: {oldActivity}.</p>
                    : <p className="mt-1 text-sm leading-relaxed">Původní krok: {oldActivity}. Potvrzením jej nahradíte.</p>
                ) : <p className="mt-1 text-sm leading-relaxed">Kontakt zatím nemá naplánovanou další aktivitu.</p>}
              </div>
            </div>
            <div>
              <label htmlFor={dateId} className="dc-text-primary text-sm font-semibold">Datum a čas</label>
              <input
                id={dateId}
                type="datetime-local"
                value={value}
                onChange={(event) => { setValue(event.target.value); setError(""); setInvalidDate(false); setStale(false); }}
                className="field mt-2 h-11 w-full px-3 text-sm"
                aria-invalid={invalidDate}
                aria-describedby={`${dateId}-hint ${invalidDate ? `${dateId}-error` : ""}`}
              />
              <p id={`${dateId}-hint`} className="dc-text-muted mt-1.5 text-xs">Povinný budoucí termín v časovém pásmu Europe/Prague.</p>
            </div>
          </div>
        ) : (
          <div className={`${warningTone} flex items-start gap-3 rounded-2xl border p-4`}>
            {clearsActivity ? <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden="true" /> : <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />}
            <div>
              <h3 className="font-semibold">
                {draft.target === "to_call" ? "Přesun bez zaznamenání hovoru" : draft.target === "listed" ? "Uzavření jako nabraná nemovitost" : draft.target === "disqualified" ? "Vyřazení z dalšího zpracování" : "Návrat do zásobníku"}
              </h3>
              {draft.target === "to_call" ? (
                <p className="mt-1 text-sm leading-relaxed">Nevznikne pokus ani nový termín. Aktuální další aktivita zůstane: {oldActivity}.</p>
              ) : draft.expectedNextActivity ? (
                <p className="mt-1 text-sm leading-relaxed">Zruší se: {oldActivity}. Zrušení se zapíše do historie kontaktu.</p>
              ) : (
                <p className="mt-1 text-sm leading-relaxed">Kontakt nemá naplánovanou aktivitu; žádná aktivita se rušit nebude.</p>
              )}
            </div>
          </div>
        )}

        {error ? (
          <div id={invalidDate ? `${dateId}-error` : undefined} role="alert" className="tone-danger rounded-xl border p-3 text-sm font-medium">
            <p>{error}</p>
            {stale ? <button type="button" onClick={() => { if (onRefreshDraft()) { setError(""); setStale(false); setInvalidDate(false); } else setError("Pro tento kontakt už stejný přesun nelze připravit. Zavřete dialog a vyberte nový cíl."); }} className="mt-3 underline underline-offset-4">Připravit nový návrh z aktuálních dat</button> : null}
          </div>
        ) : null}

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--dc-border)" }}>
          <button type="button" onClick={onClose} disabled={submitting} className="button-secondary">Zrušit bez změny</button>
          <button type="submit" disabled={submitting} className={draft.target === "disqualified" ? "button-danger" : "button-primary"}>{confirmLabel(draft.target)}</button>
        </div>
      </form>
    </AccessibleModal>
  );
}
