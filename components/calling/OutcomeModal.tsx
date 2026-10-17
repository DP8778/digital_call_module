"use client";

import { AlertTriangle, Clock3 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import AccessibleModal from "./AccessibleModal";
import { getRecommendedFollowUpAt } from "./stateLogic";
import {
  addPragueCalendarDays,
  ceilToMinute,
  formatPragueTimeWithSeconds,
  parsePragueDateTime,
  relativeDayLabel,
  toPragueDateTimeInput,
} from "./time";
import type { CallOutcome, Contact, OutcomeInput, SubmitResult } from "./types";

const OPTIONS: { value: CallOutcome; label: string; description: string }[] = [
  { value: "no_answer", label: "Nedovoláno", description: "Zapíše pokus a připraví další hovor." },
  { value: "meeting_booked", label: "Domluvena schůzka", description: "Přesune kontakt do stavu schůzky a uloží termín." },
  { value: "call_later", label: "Ozvat se později", description: "Uloží další hovor na zvolený termín." },
  { value: "disqualified", label: "Vyřadit kontakt", description: "Ukončí další zpracování kontaktu." },
];

function formatDelay(seconds: number): string {
  if (seconds <= 60) return `${seconds} sekund`;
  if (seconds % 3_600 === 0) {
    const hours = seconds / 3_600;
    return hours === 1 ? "1 hodinu" : hours >= 2 && hours <= 4 ? `${hours} hodiny` : `${hours} hodin`;
  }
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? "1 minutu" : minutes >= 2 && minutes <= 4 ? `${minutes} minuty` : `${minutes} minut`;
}

export default function OutcomeModal({ contact, now, onClose, onSubmit }: { contact: Contact; now: number; onClose: () => void; onSubmit: (input: OutcomeInput) => SubmitResult }) {
  const initialRecommendation = getRecommendedFollowUpAt(contact, now);
  const [outcome, setOutcome] = useState<CallOutcome>("no_answer");
  const [note, setNote] = useState("");
  const [clockNow, setClockNow] = useState(now);
  const [recommendationBase, setRecommendationBase] = useState(now);
  const [recommendedAt, setRecommendedAt] = useState(initialRecommendation);
  const [useRecommended, setUseRecommended] = useState(true);
  const [dateValue, setDateValue] = useState(() => toPragueDateTimeInput(ceilToMinute(initialRecommendation)));
  const [error, setError] = useState("");
  const [invalidDate, setInvalidDate] = useState(false);
  const groupName = useId();
  const noteId = useId();
  const dateId = useId();

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const exactDelaySeconds = useMemo(
    () => Math.round((recommendedAt - recommendationBase) / 1_000),
    [recommendationBase, recommendedAt],
  );
  const showsCustomDate = outcome !== "disqualified" && (outcome !== "no_answer" || !useRecommended);
  const dateLabel = outcome === "meeting_booked" ? "Termín schůzky" : "Další hovor";

  function refreshRecommendation(referenceTime: number) {
    const next = getRecommendedFollowUpAt(contact, referenceTime);
    setRecommendationBase(referenceTime);
    setRecommendedAt(next);
    setDateValue(toPragueDateTimeInput(ceilToMinute(next)));
    setError("");
    setInvalidDate(false);
  }

  function handleSelectOutcome(value: CallOutcome, currentTime: number) {
    setOutcome(value);
    setError("");
    setInvalidDate(false);
    setClockNow(currentTime);
    if (value === "no_answer") {
      setUseRecommended(true);
      refreshRecommendation(currentTime);
    }
    if (value === "meeting_booked") setDateValue(toPragueDateTimeInput(addPragueCalendarDays(currentTime, 1, 10)));
    if (value === "call_later") setDateValue(toPragueDateTimeInput(addPragueCalendarDays(currentTime, 1, 9)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const submittedAt = Date.now();
    setClockNow(submittedAt);
    const scheduledAt = outcome === "disqualified"
      ? undefined
      : outcome === "no_answer" && useRecommended
        ? recommendedAt
        : parsePragueDateTime(dateValue) ?? undefined;
    if (outcome !== "disqualified" && (!scheduledAt || scheduledAt <= submittedAt)) {
      setInvalidDate(true);
      setError(outcome === "no_answer" && useRecommended
        ? "Doporučený krátký interval už uplynul. Obnovte doporučení nebo zvolte vlastní termín."
        : "Zadejte platný budoucí termín v časovém pásmu Europe/Prague.");
      return;
    }
    const result = onSubmit({ outcome, note, scheduledAt });
    if (result.accepted) onClose();
    else {
      setInvalidDate(result.reason === "expired");
      setError(result.reason === "expired" && outcome === "no_answer" && useRecommended
        ? "Doporučený krátký interval už uplynul. Obnovte doporučení nebo zvolte vlastní termín."
        : result.message);
    }
  }

  return (
    <AccessibleModal title="Zaznamenat výsledek" description={`Kontakt: ${contact.name}`} onClose={onClose} layer="nested">
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="dc-text-primary mb-2 text-sm font-semibold">Jak hovor dopadl?</legend>
          <div className="grid gap-2">
            {OPTIONS.map((option) => (
              <label key={option.value} data-selected={outcome === option.value} data-tone={option.value === "disqualified" ? "danger" : undefined} className="choice-card flex cursor-pointer gap-3 p-3">
                <input type="radio" name={groupName} value={option.value} checked={outcome === option.value} onChange={() => handleSelectOutcome(option.value, Date.now())} className={`${option.value === "disqualified" ? "choice-radio-danger" : "choice-radio"} mt-1`} />
                <span><span className="dc-text-primary flex items-center gap-1.5 text-sm font-semibold">{option.value === "disqualified" ? <AlertTriangle className="size-4 shrink-0" aria-hidden="true" /> : null}{option.label}</span><span className="dc-text-muted mt-0.5 block text-xs leading-relaxed">{option.description}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        {outcome === "no_answer" ? (
          <fieldset aria-describedby={error && useRecommended && invalidDate ? `${dateId}-error` : undefined}>
            <legend className="dc-text-primary text-sm font-semibold">Kdy se ozvat znovu?</legend>
            <div className="mt-2 grid gap-2">
              <label data-selected={useRecommended} className="choice-card flex cursor-pointer gap-3 p-3">
                <input type="radio" name="follow-up-mode" checked={useRecommended} onChange={() => { setUseRecommended(true); setError(""); setInvalidDate(false); }} className="choice-radio mt-1" />
                <span className="min-w-0"><span className="dc-text-primary flex items-center gap-1.5 text-sm font-semibold"><Clock3 className="dc-text-muted size-4" aria-hidden="true" />Použít přesné doporučení</span><span className="dc-text-primary mt-1 block text-sm">Za {formatDelay(exactDelaySeconds)} · {relativeDayLabel(recommendedAt, clockNow)} · přesně {formatPragueTimeWithSeconds(recommendedAt)}</span><span className="dc-text-muted mt-1 block text-xs leading-relaxed">Zděděný, dosud nepotvrzený interval z původního prototypu. Uloží se přesně na sekundy.</span></span>
              </label>
              <label data-selected={!useRecommended} className="choice-card flex cursor-pointer gap-3 p-3">
                <input type="radio" name="follow-up-mode" checked={!useRecommended} onChange={() => { const currentTime = Date.now(); setUseRecommended(false); setDateValue(toPragueDateTimeInput(ceilToMinute(Math.max(recommendedAt, currentTime + 60_000)))); setClockNow(currentTime); setError(""); setInvalidDate(false); }} className="choice-radio mt-1" />
                <span><span className="dc-text-primary block text-sm font-semibold">Zvolit vlastní termín</span><span className="dc-text-muted mt-1 block text-xs">Vlastní termín se zadává s přesností na minuty.</span></span>
              </label>
            </div>
          </fieldset>
        ) : null}

        {showsCustomDate ? (
          <div>
            <label htmlFor={dateId} className="dc-text-primary text-sm font-semibold">{dateLabel}</label>
            <input id={dateId} type="datetime-local" value={dateValue} onChange={(event) => { setDateValue(event.target.value); setError(""); setInvalidDate(false); }} className="field mt-2 h-11 w-full px-3 text-sm" aria-describedby={`${dateId}-hint ${invalidDate ? `${dateId}-error` : ""}`} aria-invalid={invalidDate} />
            <p id={`${dateId}-hint`} className="dc-text-muted mt-1.5 text-xs">Termín musí být v budoucnosti. Zobrazení: Praha.</p>
          </div>
        ) : null}

        {error ? (
          <div id={`${dateId}-error`} role="alert" className="tone-danger flex items-start gap-2 rounded-xl border p-3 text-sm font-medium">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{error}{outcome === "no_answer" && useRecommended && invalidDate ? <button type="button" onClick={() => refreshRecommendation(Date.now())} className="focus-ring ml-2 rounded px-1 font-semibold underline underline-offset-2">Obnovit doporučení</button> : null}</span>
          </div>
        ) : null}

        <div>
          <label htmlFor={noteId} className="dc-text-primary text-sm font-semibold">Krátká poznámka <span className="dc-text-muted font-normal">(volitelné)</span></label>
          <textarea id={noteId} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={280} placeholder="Co bude užitečné vědět při dalším kontaktu?" className="field mt-2 w-full resize-y px-3 py-2.5 text-sm" />
          <div className="dc-text-faint mt-1 text-right text-xs">{note.length}/280</div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--dc-border)" }}><button type="button" onClick={onClose} className="button-secondary">Zrušit</button><button type="submit" className={outcome === "disqualified" ? "button-danger" : "button-primary"}>{outcome === "disqualified" ? <><AlertTriangle className="size-4 shrink-0" aria-hidden="true" />Vyřadit kontakt a ukončit zpracování</> : "Uložit výsledek"}</button></div>
      </form>
    </AccessibleModal>
  );
}
