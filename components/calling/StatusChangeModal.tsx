"use client";

import { AlertTriangle } from "lucide-react";
import AccessibleModal from "./AccessibleModal";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL } from "./labels";
import { formatPragueDateTimePrecise } from "./time";
import type { ColumnId, Contact } from "./types";

export default function StatusChangeModal({
  contact,
  target,
  onClose,
  onConfirm,
}: {
  contact: Contact;
  target: ColumnId;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AccessibleModal title="Potvrdit změnu stavu" description={`${contact.name} → ${COLUMN_LABEL_CS[target]}`} onClose={onClose} layer="nested">
      <div className="space-y-5 p-5 sm:p-6">
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div><h3 className="font-semibold">Tato změna zruší naplánovanou aktivitu</h3>{contact.nextActivity ? <p className="mt-1 text-sm leading-relaxed">{ACTIVITY_LABEL[contact.nextActivity.type]} · {formatPragueDateTimePrecise(contact.nextActivity.dueAt)}</p> : null}<p className="mt-2 text-sm leading-relaxed">Zrušení se zapíše do historie kontaktu, aby se další krok neztratil beze stopy.</p></div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="button-secondary">Ponechat současný stav</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="focus-ring inline-flex h-11 items-center justify-center rounded-xl bg-amber-700 px-4 text-sm font-semibold text-white hover:bg-amber-800">Změnit stav a zrušit aktivitu</button>
        </div>
      </div>
    </AccessibleModal>
  );
}
