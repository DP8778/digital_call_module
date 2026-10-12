"use client";

import { Clock3 } from "lucide-react";
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
import type { CallOutcome, Contact, OutcomeInput } from "./types";

const OPTIONS: { value: CallOutcome; label: string; description: string }[] = [
  { value: "no_answer", label: "Nedovoláno", description: "Zapíše pokus a připraví další hovor." },
  { value: "meeting_booked", label: "Domluvena schůzka", description: "Přesune kontakt do stavu schůzky a uloží termín." },
  { value: "call_later", label: "Ozvat se později", description: "Uloží další hovor na zvolený termín." },
  { value: "disqualified", label: "Vyřadit", description: "Ukončí další zpracování kontaktu." },
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

export default function OutcomeModal({ contact, now, onClose, onSubmit }: { contact: Contact; now: number; onClose: () => void; onSubmit: (input: OutcomeInput) => void }) {
  const initialRecommendation = getRecommendedFollowUpAt(contact, now);
  const [outcome, setOutcome] = useState<CallOutcome>("no_answer");
  const [note, setNote] = useState("");
  const [clockNow, setClockNow] = useState(now);
  const [recommendationBase, setRecommendationBase] = useState(now);
  const [recommendedAt, setRecommendedAt] = useState(initialRecommendation);
  const [useRecommended, setUseRecommended] = useState(true);
  const [dateValue, setDateValue] = useState(() => toPragueDateTimeInput(ceilToMinute(initialRecommendation)));
  const [error, setError] = useState("");
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
  }

  function selectOutcome(value: CallOutcome) {
    setOutcome(value);
    setError("");
    if (value === "no_answer") {
      setUseRecommended(true);
      refreshRecommendation(clockNow);
    }
    if (value === "meeting_booked") setDateValue(toPragueDateTimeInput(addPragueCalendarDays(clockNow, 1, 10)));
    if (value === "call_later") setDateValue(toPragueDateTimeInput(addPragueCalendarDays(clockNow, 1, 9)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const scheduledAt = outcome === "disqualified"
      ? undefined
      : outcome === "no_answer" && useRecommended
        ? recommendedAt
        : parsePragueDateTime(dateValue) ?? undefined;
    if (outcome !== "disqualified" && (!scheduledAt || scheduledAt <= clockNow)) {
      setError(outcome === "no_answer" && useRecommended
        ? "Doporučený krátký interval už uplynul. Obnovte doporučení nebo zvolte vlastní termín."
        : "Zadejte platný budoucí termín v časovém pásmu Europe/Prague.");
      return;
    }
    onSubmit({ outcome, note, scheduledAt });
    onClose();
  }

  return (
    <AccessibleModal title="Zaznamenat výsledek" description={`Kontakt: ${contact.name}`} onClose={onClose} layer="nested">
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="text-main mb-2 text-sm font-semibold">Jak hovor dopadl?</legend>
          <div className="grid gap-2">
            {OPTIONS.map((option) => (
              <label key={option.value} data-selected={outcome === option.value} className="choice-card flex cursor-pointer gap-3 p-3 focus-within:ring-2 focus-within:ring-[var(--dc-focus)]/30">
                <input type="radio" name={groupName} value={option.value} checked={outcome === option.value} onChange={() => selectOutcome(option.value)} className="mt-1 accent-[var(--dc-accent)]" />
                <span><span className="text-main block text-sm font-semibold">{option.label}</span><span className="text-muted mt-0.5 block text-xs leading-relaxed">{option.description}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        {outcome === "no_answer" ? (
          <fieldset>
            <legend className="text-main text-sm font-semibold">Kdy se ozvat znovu?</legend>
            <div className="mt-2 grid gap-2">
              <label data-selected={useRecommended} className="choice-card flex cursor-pointer gap-3 p-3 focus-within:ring-2 focus-within:ring-[var(--dc-focus)]/30">
                <input type="radio" name="follow-up-mode" checked={useRecommended} onChange={() => { setUseRecommended(true); setError(""); }} className="mt-1 accent-[var(--dc-accent)]" />
                <span className="min-w-0"><span className="text-main flex items-center gap-1.5 text-sm font-semibold"><Clock3 className="size-4 text-[var(--dc-accent)]" aria-hidden="true" />Použít přesné doporučení</span><span className="text-main mt-1 block text-sm">Za {formatDelay(exactDelaySeconds)} · {relativeDayLabel(recommendedAt, clockNow)} · přesně {formatPragueTimeWithSeconds(recommendedAt)}</span><span className="text-muted mt-1 block text-xs leading-relaxed">Zděděný, dosud nepotvrzený interval z původního prototypu. Uloží se přesně na sekundy.</span></span>
              </label>
              <label data-selected={!useRecommended} className="choice-card flex cursor-pointer gap-3 p-3 focus-within:ring-2 focus-within:ring-[var(--dc-focus)]/30">
                <input type="radio" name="follow-up-mode" checked={!useRecommended} onChange={() => { setUseRecommended(false); setDateValue(toPragueDateTimeInput(ceilToMinute(Math.max(recommendedAt, clockNow + 60_000)))); setError(""); }} className="mt-1 accent-[var(--dc-accent)]" />
                <span><span className="text-main block text-sm font-semibold">Zvolit vlastní termín</span><span className="text-muted mt-1 block text-xs">Vlastní termín se zadává s přesností na minuty.</span></span>
              </label>
            </div>
          </fieldset>
        ) : null}

        {showsCustomDate ? (
          <div>
            <label htmlFor={dateId} className="text-main text-sm font-semibold">{dateLabel}</label>
            <input id={dateId} type="datetime-local" value={dateValue} onChange={(event) => { setDateValue(event.target.value); setError(""); }} className="field mt-2 h-11 w-full px-3 text-sm" aria-describedby={`${dateId}-hint ${error ? `${dateId}-error` : ""}`} aria-invalid={Boolean(error)} />
            <p id={`${dateId}-hint`} className="text-muted mt-1.5 text-xs">Termín musí být v budoucnosti. Zobrazení: Praha.</p>
          </div>
        ) : null}

        {error ? (
          <div id={`${dateId}-error`} role="alert" className="tone-danger rounded-xl border p-3 text-sm font-medium">
            {error}
            {outcome === "no_answer" && useRecommended ? <button type="button" onClick={() => refreshRecommendation(clockNow)} className="focus-ring ml-2 rounded px-1 font-semibold underline underline-offset-2">Obnovit doporučení</button> : null}
          </div>
        ) : null}

        <div>
          <label htmlFor={noteId} className="text-main text-sm font-semibold">Krátká poznámka <span className="text-muted font-normal">(volitelné)</span></label>
          <textarea id={noteId} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={280} placeholder="Co bude užitečné vědět při dalším kontaktu?" className="field mt-2 w-full resize-y px-3 py-2.5 text-sm" />
          <div className="text-faint mt-1 text-right text-xs">{note.length}/280</div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--dc-border)" }}><button type="button" onClick={onClose} className="button-secondary">Zrušit</button><button type="submit" className="button-primary">Uložit výsledek</button></div>
      </form>
    </AccessibleModal>
  );
}
