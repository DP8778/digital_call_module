"use client";

import { useEffect, useId, useState } from "react";
import AccessibleModal from "./AccessibleModal";
import { addPragueCalendarDays, parsePragueDateTime, toPragueDateTimeInput } from "./time";
import type { ActivityType, Contact, ScheduleInput } from "./types";

export default function ScheduleModal({ contact, now, onClose, onSubmit }: { contact: Contact; now: number; onClose: () => void; onSubmit: (input: ScheduleInput) => void }) {
  const [activityType, setActivityType] = useState<ActivityType>(contact.nextActivity?.type ?? "call");
  const [value, setValue] = useState(() => toPragueDateTimeInput(contact.nextActivity?.dueAt ?? addPragueCalendarDays(now, 1, 9)));
  const [clockNow, setClockNow] = useState(now);
  const [error, setError] = useState("");
  const dateId = useId();

  useEffect(() => {
    const timer = window.setInterval(() => setClockNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const dueAt = parsePragueDateTime(value);
    if (!dueAt || dueAt <= clockNow) { setError("Zadejte platný budoucí termín v časovém pásmu Europe/Prague."); return; }
    onSubmit({ activityType, dueAt }); onClose();
  }

  return (
    <AccessibleModal title={contact.nextActivity ? "Upravit další aktivitu" : "Naplánovat další aktivitu"} description={`Termín nemění procesní stav kontaktu ${contact.name}.`} onClose={onClose} layer="nested">
      <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="text-main text-sm font-semibold">Typ aktivity</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {(["call", "meeting"] as ActivityType[]).map((type) => (
              <label key={type} data-selected={activityType === type} className="choice-card flex cursor-pointer items-center gap-2 p-3 text-sm font-medium focus-within:ring-2 focus-within:ring-[var(--dc-focus)]/30">
                <input type="radio" name="activity-type" checked={activityType === type} onChange={() => setActivityType(type)} className="accent-[var(--dc-accent)]" />
                {type === "call" ? "Hovor" : "Schůzka"}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor={dateId} className="text-main text-sm font-semibold">Datum a čas</label>
          <input id={dateId} type="datetime-local" value={value} onChange={(event) => { setValue(event.target.value); setError(""); }} className="field mt-2 h-11 w-full px-3 text-sm" aria-invalid={Boolean(error)} aria-describedby={`${dateId}-hint ${error ? `${dateId}-error` : ""}`} />
          <p id={`${dateId}-hint`} className="text-muted mt-1.5 text-xs">Čas je interpretován a zobrazen pro Europe/Prague.</p>
          {error ? <p id={`${dateId}-error`} role="alert" className="mt-1.5 text-sm font-medium text-[var(--dc-danger)]">{error}</p> : null}
        </div>
        <div className="tone-info rounded-xl border p-3 text-sm leading-relaxed">Uložení termínu pouze upraví příští aktivitu. Stav kontaktu změníte samostatně nebo při zaznamenání výsledku hovoru.</div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--dc-border)" }}><button type="button" onClick={onClose} className="button-secondary">Zrušit</button><button type="submit" className="button-primary">Uložit termín</button></div>
      </form>
    </AccessibleModal>
  );
}
