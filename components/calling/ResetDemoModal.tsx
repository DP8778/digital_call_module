"use client";

import { TriangleAlert } from "lucide-react";
import AccessibleModal from "./AccessibleModal";

export default function ResetDemoModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <AccessibleModal title="Obnovit výchozí demo?" description="Tato akce nahradí lokální stav ukázkovými daty." onClose={onClose}>
      <div className="space-y-5 p-5 sm:p-6">
        <div className="tone-warning flex gap-3 rounded-2xl border p-4">
          <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">Lokální změny budou odstraněny</h3>
            <p className="mt-1 text-sm leading-relaxed">Výsledky hovorů, upravené termíny i přesuny stavů z tohoto prohlížeče se vrátí do výchozího scénáře.</p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end" style={{ borderColor: "var(--dc-border)" }}>
          <button type="button" onClick={onClose} className="button-secondary">Ponechat moje změny</button>
          <button type="button" onClick={() => { onConfirm(); onClose(); }} className="button-danger"><TriangleAlert className="size-4 shrink-0" aria-hidden="true" />Obnovit demo a odstranit lokální změny</button>
        </div>
      </div>
    </AccessibleModal>
  );
}
