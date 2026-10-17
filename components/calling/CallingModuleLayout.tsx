"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import ContactDetail from "./ContactDetail";
import { ACTIVITY_LABEL } from "./labels";
import OutcomeModal from "./OutcomeModal";
import ProcessBoard from "./ProcessBoard";
import ResetDemoModal from "./ResetDemoModal";
import ScheduleModal from "./ScheduleModal";
import StatusChangeModal from "./StatusChangeModal";
import TodayView from "./TodayView";
import { formatPragueDateTime, formatPragueDateTimePrecise } from "./time";
import type { ActionFeedback, ColumnId, Contact, OutcomeInput, ScheduleInput } from "./types";
import { useCallingUiState, type CallingView } from "./uiState";
import { useCallingBoardState } from "./useCallingBoardState";

export default function CallingModuleLayout() {
  const board = useCallingBoardState();
  const ui = useCallingUiState();
  const { filters, view } = ui.state;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<ColumnId | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<{ contactId: string; view: CallingView } | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedId || !focusRequest || focusRequest.view !== view) return;
    const frame = window.requestAnimationFrame(() => {
      const prefix = view === "today" ? "queue-contact" : "process-contact";
      const fallbackId = view === "today" ? "queue-heading" : "process-heading";
      const target = document.getElementById(`${prefix}-${focusRequest.contactId}`)
        ?? document.getElementById(fallbackId);
      target?.focus();
      setFocusRequest(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, selectedId, view]);

  const selectedContact = useMemo(
    () => board.state?.contacts.find((contact) => contact.id === selectedId) ?? null,
    [board.state, selectedId],
  );

  function openContact(contact: Contact) {
    setSelectedId(contact.id);
    setFeedback(null);
    setNow(Date.now());
  }

  function applyMove(target: ColumnId) {
    if (!selectedContact) return;
    const cancelled = Boolean(selectedContact.nextActivity) && (target === "backlog" || target === "listed" || target === "disqualified");
    board.moveContact(selectedContact.id, target);
    const description = `Kontakt je nyní ve stavu „${COLUMN_LABEL_CS[target]}“.${cancelled ? " Původní aktivita byla zrušena a zapsána do historie." : ""}`;
    setFeedback({ title: "Stav kontaktu byl změněn", description });
    setAnnouncement(description);
  }

  function requestMove(target: ColumnId) {
    if (!selectedContact) return;
    const cancelsActivity = Boolean(selectedContact.nextActivity) && (target === "backlog" || target === "listed" || target === "disqualified");
    if (cancelsActivity) {
      setPendingMove(target);
      return;
    }
    applyMove(target);
  }

  function closeDetail(returnView: CallingView = view) {
    if (selectedId) setFocusRequest({ contactId: selectedId, view: returnView });
    if (returnView !== view) ui.setView(returnView);
    setSelectedId(null);
    setOutcomeOpen(false);
    setScheduleOpen(false);
    setPendingMove(null);
    setFeedback(null);
  }

  function handleOutcome(input: OutcomeInput) {
    if (!selectedContact) return;
    const outcomeLabel = input.outcome === "no_answer"
      ? "Nedovoláno"
      : input.outcome === "meeting_booked"
        ? "Domluvena schůzka"
        : input.outcome === "call_later"
          ? "Ozvat se později"
          : "Kontakt vyřazen";
    const target: ColumnId = input.outcome === "meeting_booked"
      ? "meeting"
      : input.outcome === "disqualified"
        ? "disqualified"
        : "call_later";
    const nextStep = input.scheduledAt
      ? `${input.outcome === "meeting_booked" ? ACTIVITY_LABEL.meeting : ACTIVITY_LABEL.call} · ${formatPragueDateTimePrecise(input.scheduledAt)}`
      : "Žádná další aktivita";
    board.recordOutcome(selectedContact.id, input);
    setFeedback({
      title: input.outcome === "disqualified" ? "Vyřazení bylo uloženo" : `${outcomeLabel} bylo zaznamenáno`,
      description: `Kontakt se přesunul do stavu „${COLUMN_LABEL_CS[target]}“.`,
      nextStep,
    });
    setAnnouncement(`${outcomeLabel} bylo zaznamenáno. Nový stav: ${COLUMN_LABEL_CS[target]}. Další krok: ${nextStep}.`);
  }

  function handleSchedule(input: ScheduleInput) {
    if (!selectedContact) return;
    board.scheduleActivity(selectedContact.id, input);
    const nextStep = `${ACTIVITY_LABEL[input.activityType]} · ${formatPragueDateTime(input.dueAt)}`;
    setFeedback({ title: "Termín byl uložen", description: "Procesní stav kontaktu se nezměnil.", nextStep });
    setAnnouncement(`Termín další aktivity byl uložen: ${nextStep}.`);
  }

  function resetDemo() {
    board.resetDemo();
    ui.reset();
    closeDetail("today");
    setAnnouncement("Demo bylo obnoveno do výchozího stavu.");
  }

  if (!board.state) {
    return (
      <>
        <Navbar view={view} onViewChange={ui.setView} />
        <main className="flex min-h-0 flex-1 flex-col">
          <div className="mx-auto w-full max-w-7xl animate-pulse px-4 py-8 sm:px-6" aria-label="Načítání dema">
            <div className="surface-subtle h-7 w-56 rounded-lg" />
            <div className="surface-subtle mt-3 h-4 w-96 max-w-full rounded" />
            <div className="content-surface mt-8 h-20" />
            <div className="mt-6 space-y-3"><div className="content-surface h-28" /><div className="content-surface h-28" /></div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar view={view} onViewChange={ui.setView} />
      <main className="flex min-h-0 flex-1 flex-col">

      {board.storageNotice ? (
        <div role="status" className="tone-warning border-b px-4 py-3 text-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4"><span className="flex items-start gap-2"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><span>{board.storageNotice === "recovered" ? "Uložená data nebyla platná. Demo bylo bezpečně obnoveno z výchozího datasetu." : board.storageNotice === "read-unavailable" ? "Uložená data se nepodařilo přečíst. Demo běží jen v paměti a změny se automaticky neukládají, aby se původní stav nepřepsal." : "Aktuální změny se nepodařilo uložit. Demo pokračuje v paměti, po zavření ale změny nemusí zůstat zachované."}</span></span><button type="button" onClick={board.dismissStorageNotice} className="button-quiet h-9 shrink-0 px-2">Skrýt</button></div>
        </div>
      ) : null}

      <div aria-live="polite" className="sr-only">{announcement}</div>
      {view === "today" ? <TodayView contacts={board.state.contacts} now={now} filters={filters} selectedId={selectedId} onFiltersChange={ui.setFilters} onOpenContact={openContact} onResetDemo={() => setResetOpen(true)} /> : <ProcessBoard contacts={board.state.contacts} now={now} filters={filters} selectedId={selectedId} onFiltersChange={ui.setFilters} onOpenContact={openContact} onResetDemo={() => setResetOpen(true)} />}

      {selectedContact ? (
        <ContactDetail
          contact={selectedContact}
          now={now}
          active={!outcomeOpen && !scheduleOpen && pendingMove === null}
          feedback={feedback}
          onClose={() => closeDetail()}
          onBackToQueue={() => closeDetail("today")}
          onDismissFeedback={() => setFeedback(null)}
          onMove={requestMove}
          onRecordOutcome={() => { setNow(Date.now()); setOutcomeOpen(true); }}
          onSchedule={() => { setNow(Date.now()); setScheduleOpen(true); }}
        />
      ) : null}
      {selectedContact && outcomeOpen ? (
        <OutcomeModal contact={selectedContact} now={now} onClose={() => setOutcomeOpen(false)} onSubmit={handleOutcome} />
      ) : null}
      {selectedContact && scheduleOpen ? (
        <ScheduleModal contact={selectedContact} now={now} onClose={() => setScheduleOpen(false)} onSubmit={handleSchedule} />
      ) : null}
      {selectedContact && pendingMove ? (
        <StatusChangeModal contact={selectedContact} target={pendingMove} onClose={() => setPendingMove(null)} onConfirm={() => applyMove(pendingMove)} />
      ) : null}
      {resetOpen ? <ResetDemoModal onClose={() => setResetOpen(false)} onConfirm={resetDemo} /> : null}
      </main>
    </>
  );
}
