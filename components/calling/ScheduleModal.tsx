"use client";

import { AlertTriangle, Info } from "lucide-react";
import { useId, useState } from "react";
import AccessibleModal from "./AccessibleModal";
import { addPragueCalendarDays, parsePragueDateTime, toPragueDateTimeInput } from "./time";
import type { ActivityType, Contact, ScheduleInput, SubmitResult } from "./types";

export default function ScheduleModal({ contact, now, onClose, onSubmit }: { contact: Contact; now: number; onClose: () => void; onSubmit: (input: ScheduleInput) => SubmitResult }) {
  const [activityType, setActivityType] = useState<ActivityType>(contact.nextActivity?.type ?? "call");
  const [value, setValue] = useState(() => toPragueDateTimeInput(contact.nextActivity?.dueAt ?? addPragueCalendarDays(now, 1, 9)));
  const [error, setError] = useState("");
  const [invalidDate, setInvalidDate] = useState(false);
  const dateId = useId();

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const submittedAt = Date.now();
    const dueAt = parsePragueDateTime(value);
    if (!dueAt || dueAt <= submittedAt) { setInvalidDate(true); setError("Zadejte platný budoucí termín v časovém pásmu Europe/Prague."); return; }
    const result = onSubmit({ activityType, dueAt });
    if (result.accepted) onClose();
    else { setInvalidDate(result.reason === "expired"); setError(result.message); }
  }

  return (
    <AccessibleModal title={contact.nextActivity ? "Upravit další aktivitu" : "Naplánovat další aktivitu"} description={`Termín nemění procesní stav kontaktu ${contact.name}.`} onClose={onClose} layer="nested">
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="dc-text-primary text-sm font-semibold">Typ aktivity</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["call", "meeting"] as ActivityType[]).map((type) => (
              <label key={type} data-selected={activityType === type} className="choice-card flex cursor-pointer items-center gap-2 p-3 text-sm font-medium">
                <input type="radio" name="activity-type" checked={activityType === type} onChange={() => setActivityType(type)} className="choice-radio" />
                {type === "call" ? "Hovor" : "Schůzka"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={dateId} className="dc-text-primary text-sm font-semibold">Datum a čas</label>
          <input id={dateId} type="datetime-local" value={value} onChange={(event) => { setValue(event.target.value); setError(""); setInvalidDate(false); }} className="field mt-2 h-11 w-full px-3 text-sm" aria-invalid={invalidDate} aria-describedby={`${dateId}-hint ${invalidDate ? `${dateId}-error` : ""}`} />
          <p id={`${dateId}-hint`} className="dc-text-muted mt-1.5 text-xs">Čas je interpretován a zobrazen pro Europe/Prague.</p>
          {error ? <p id={`${dateId}-error`} role="alert" className="tone-danger mt-2 flex items-start gap-2 rounded-xl border p-3 text-sm font-medium"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{error}</p> : null}
        </div>
        <div className="tone-info flex items-start gap-2 rounded-xl border p-3 text-sm leading-relaxed"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />Uložení termínu pouze upraví příští aktivitu. Stav kontaktu změníte samostatně nebo při zaznamenání výsledku hovoru.</div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--dc-border)" }}><button type="button" onClick={onClose} className="button-secondary">Zrušit</button><button type="submit" className="button-primary">Uložit termín</button></div>
      </form>
    </AccessibleModal>
  );
}
