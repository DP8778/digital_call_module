"use client";

import { useId, useMemo, useState } from "react";
import AccessibleModal from "./AccessibleModal";
import { getRecommendedFollowUpAt } from "./stateLogic";
import { addPragueCalendarDays, parsePragueDateTime, toPragueDateTimeInput } from "./time";
import type { CallOutcome, Contact, OutcomeInput } from "./types";

const OPTIONS: { value: CallOutcome; label: string; description: string }[] = [
  { value: "no_answer", label: "Nedovoláno", description: "Zapíše pokus a navrhne další hovor podle zdroje." },
  { value: "meeting_booked", label: "Domluvena schůzka", description: "Přesune kontakt do stavu schůzky a uloží termín." },
  { value: "call_later", label: "Ozvat se později", description: "Uloží další hovor na zvolený termín." },
  { value: "disqualified", label: "Vyřadit", description: "Ukončí další zpracování kontaktu." },
];

export default function OutcomeModal({ contact, now, onClose, onSubmit }: { contact: Contact; now: number; onClose: () => void; onSubmit: (input: OutcomeInput) => void }) {
  const [outcome, setOutcome] = useState<CallOutcome>("no_answer");
  const [note, setNote] = useState("");
  const [dateValue, setDateValue] = useState(() => toPragueDateTimeInput(getRecommendedFollowUpAt(contact, now)));
  const [error, setError] = useState("");
  const groupName = useId();
  const noteId = useId();
  const dateId = useId();
  const dateLabel = outcome === "meeting_booked" ? "Termín schůzky" : "Další hovor";
  const showsDate = outcome !== "disqualified";
  const hint = useMemo(() => outcome === "no_answer" ? "Předvyplněno podle zdroje kontaktu; termín můžete upravit." : "Termín musí být v budoucnosti.", [outcome]);

  function selectOutcome(value: CallOutcome) {
    setOutcome(value); setError("");
    if (value === "no_answer") setDateValue(toPragueDateTimeInput(getRecommendedFollowUpAt(contact, now)));
    if (value === "meeting_booked") setDateValue(toPragueDateTimeInput(addPragueCalendarDays(now, 1, 10)));
    if (value === "call_later") setDateValue(toPragueDateTimeInput(addPragueCalendarDays(now, 1, 9)));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedTimestamp = showsDate ? parsePragueDateTime(dateValue) : undefined;
    if (showsDate && (!parsedTimestamp || parsedTimestamp <= now)) { setError("Zadejte platný budoucí termín v časovém pásmu Europe/Prague."); return; }
    onSubmit({ outcome, note, scheduledAt: parsedTimestamp ?? undefined }); onClose();
  }

  return (
    <AccessibleModal title="Zaznamenat výsledek" description={`Kontakt: ${contact.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-slate-900">Jak hovor dopadl?</legend>
          <div className="grid gap-2">
            {OPTIONS.map((option) => (
              <label key={option.value} className={`focus-within:ring-2 focus-within:ring-teal-600/30 flex cursor-pointer gap-3 rounded-xl border p-3 ${outcome === option.value ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" name={groupName} value={option.value} checked={outcome === option.value} onChange={() => selectOutcome(option.value)} className="mt-1 accent-teal-700" />
                <span><span className="block text-sm font-semibold text-slate-900">{option.label}</span><span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{option.description}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        {showsDate ? (
          <div>
            <label htmlFor={dateId} className="text-sm font-semibold text-slate-900">{dateLabel}</label>
            <input id={dateId} type="datetime-local" value={dateValue} onChange={(event) => { setDateValue(event.target.value); setError(""); }} className="focus-ring mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm" aria-describedby={`${dateId}-hint ${error ? `${dateId}-error` : ""}`} aria-invalid={Boolean(error)} />
            <p id={`${dateId}-hint`} className="mt-1.5 text-xs text-slate-500">{hint} Zobrazení: Praha.</p>
            {error ? <p id={`${dateId}-error`} role="alert" className="mt-1.5 text-sm font-medium text-rose-700">{error}</p> : null}
          </div>
        ) : null}
        <div>
          <label htmlFor={noteId} className="text-sm font-semibold text-slate-900">Krátká poznámka <span className="font-normal text-slate-400">(volitelné)</span></label>
          <textarea id={noteId} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={280} placeholder="Co bude užitečné vědět při dalším kontaktu?" className="focus-ring mt-2 w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />
          <div className="mt-1 text-right text-xs text-slate-400">{note.length}/280</div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="button-secondary">Zrušit</button><button type="submit" className="button-primary">Uložit výsledek</button></div>
      </form>
    </AccessibleModal>
  );
}
