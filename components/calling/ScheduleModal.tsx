"use client";

import type { Contact } from "./types";
import { useEffect, useMemo, useState } from "react";

type ScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (timestamp: number) => void;
  contact: Contact;
  targetColumn: "meeting" | "call_later";
};

function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ScheduleModal({
  isOpen,
  onClose,
  onConfirm,
  contact,
  targetColumn,
}: ScheduleModalProps) {
  const defaultValue = useMemo(() => toDateTimeLocalValue(new Date()), []);
  const [value, setValue] = useState<string>(defaultValue);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue(toDateTimeLocalValue(new Date()));
  }, [isOpen]);

  function handleConfirm() {
    const parsed = new Date(value);
    const ts = parsed.getTime();
    if (Number.isNaN(ts)) return;
    onConfirm(ts);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 dark:bg-black/60"
      onMouseDown={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:border dark:border-zinc-600 dark:bg-[#111827]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="mb-4">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-[#f9fafb]">
            {contact.name} – Naplánovat přesun do {targetColumn}
          </h2>
        </header>

        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Datum a čas
          </label>
          <input
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-[#f9fafb] dark:focus:border-zinc-500 dark:focus:ring-zinc-700"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 active:bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 dark:active:bg-zinc-600"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={onClose}
          >
            Zrušit
          </button>
          <button
            type="button"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-800 active:bg-zinc-950 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white dark:active:bg-zinc-200"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleConfirm}
          >
            Potvrdit
          </button>
        </div>
      </div>
    </div>
  );
}

