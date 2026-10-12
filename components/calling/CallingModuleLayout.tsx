"use client";

import { KanbanSquare, ListTodo, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ContactDetail from "./ContactDetail";
import OutcomeModal from "./OutcomeModal";
import ProcessBoard from "./ProcessBoard";
import ScheduleModal from "./ScheduleModal";
import TodayView from "./TodayView";
import type { ColumnId, Contact } from "./types";
import { useCallingBoardState } from "./useCallingBoardState";

type View = "today" | "process";

export default function CallingModuleLayout() {
  const board = useCallingBoardState();
  const [view, setView] = useState<View>("today");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedContact = useMemo(
    () => board.state?.contacts.find((contact) => contact.id === selectedId) ?? null,
    [board.state, selectedId],
  );

  function openContact(contact: Contact) {
    setSelectedId(contact.id);
    setNow(Date.now());
  }

  function moveSelected(target: ColumnId) {
    if (!selectedContact) return;
    board.moveContact(selectedContact.id, target);
    setAnnouncement("Stav kontaktu byl změněn.");
  }

  function resetDemo() {
    if (!window.confirm("Obnovit výchozí demo? Všechny lokálně provedené změny budou nahrazeny.")) return;
    board.resetDemo();
    setSelectedId(null);
    setAnnouncement("Demo bylo obnoveno do výchozího stavu.");
  }

  if (!board.state) {
    return (
      <div className="mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6" aria-label="Načítání dema">
        <div className="h-7 w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
        <div className="mt-8 h-20 rounded-2xl bg-white shadow-sm" />
        <div className="mt-6 space-y-3"><div className="h-28 rounded-2xl bg-white" /><div className="h-28 rounded-2xl bg-white" /></div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <nav aria-label="Hlavní zobrazení" className="flex rounded-xl bg-slate-100 p-1">
            <button type="button" onClick={() => setView("today")} aria-current={view === "today" ? "page" : undefined} className={`focus-ring flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${view === "today" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}><ListTodo className="size-4" aria-hidden="true" />K řešení</button>
            <button type="button" onClick={() => setView("process")} aria-current={view === "process" ? "page" : undefined} className={`focus-ring flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-semibold ${view === "process" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-950"}`}><KanbanSquare className="size-4" aria-hidden="true" />Proces</button>
          </nav>
          <button type="button" onClick={resetDemo} className="focus-ring flex h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-950"><RotateCcw className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Obnovit demo</span></button>
        </div>
      </div>

      {board.storageRecovered ? (
        <div role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4"><span>Uložená data nebyla kompatibilní nebo dostupná. Demo bylo bezpečně obnoveno.</span><button type="button" onClick={board.dismissStorageWarning} className="focus-ring shrink-0 rounded-lg px-2 py-1 font-semibold hover:bg-amber-100">Skrýt</button></div>
        </div>
      ) : null}

      <div aria-live="polite" className="sr-only">{announcement}</div>
      {view === "today" ? <TodayView contacts={board.state.contacts} now={now} onOpenContact={openContact} /> : <ProcessBoard contacts={board.state.contacts} now={now} onOpenContact={openContact} />}

      {selectedContact ? (
        <ContactDetail
          contact={selectedContact}
          now={now}
          onClose={() => setSelectedId(null)}
          onMove={moveSelected}
          onRecordOutcome={() => { setNow(Date.now()); setOutcomeOpen(true); }}
          onSchedule={() => { setNow(Date.now()); setScheduleOpen(true); }}
        />
      ) : null}
      {selectedContact && outcomeOpen ? (
        <OutcomeModal contact={selectedContact} now={now} onClose={() => setOutcomeOpen(false)} onSubmit={(input) => { board.recordOutcome(selectedContact.id, input); setAnnouncement("Výsledek hovoru a další krok byly uloženy."); }} />
      ) : null}
      {selectedContact && scheduleOpen ? (
        <ScheduleModal contact={selectedContact} now={now} onClose={() => setScheduleOpen(false)} onSubmit={(input) => { board.scheduleActivity(selectedContact.id, input); setAnnouncement("Termín další aktivity byl uložen."); }} />
      ) : null}
    </>
  );
}
