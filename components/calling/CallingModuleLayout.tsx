"use client";

import { TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/layout/Navbar";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import ContactDetail from "./ContactDetail";
import { openAcceptedContactInWork } from "./detailNavigation";
import { ACTIVITY_LABEL } from "./labels";
import OutcomeModal from "./OutcomeModal";
import NewContactsView from "./NewContactsView";
import MoveConfirmationModal from "./MoveConfirmationModal";
import ProcessBoard from "./ProcessBoard";
import ResetDemoModal from "./ResetDemoModal";
import ScheduleModal from "./ScheduleModal";
import StatusChangeModal from "./StatusChangeModal";
import TodayView from "./TodayView";
import { formatPragueDateTimePrecise } from "./time";
import type { ActionFeedback, ColumnId, Contact, ContactMoveDraft, OutcomeInput, ScheduleInput, SubmitResult } from "./types";
import { useCallingUiState, type CallingView } from "./uiState";
import { useCallingBoardState } from "./useCallingBoardState";

function rejectionMessage(reason: "unavailable" | "expired" | "stale"): string {
  if (reason === "expired") return "Termín mezitím uplynul. Zvolte nový budoucí termín.";
  if (reason === "unavailable") return "Demo ještě není připravené. Zkuste akci potvrdit znovu.";
  return "Změna nebyla přijata. Kontakt se mohl mezitím změnit; zkontrolujte jej a potvrďte akci znovu.";
}

export default function CallingModuleLayout() {
  const board = useCallingBoardState();
  const ui = useCallingUiState();
  const { filters, view } = ui.state;
  const { newFilters } = ui.state;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [pendingMove, setPendingMove] = useState<ColumnId | null>(null);
  const [pendingBoardMove, setPendingBoardMove] = useState<{ draft: ContactMoveDraft; focusId: string } | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [boardNotice, setBoardNotice] = useState("");
  const [feedback, setFeedback] = useState<ActionFeedback | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [announcement, setAnnouncement] = useState("");
  const [focusRequest, setFocusRequest] = useState<{ contactId: string; view: CallingView } | null>(null);
  const [detailOrigin, setDetailOrigin] = useState<CallingView>("today");
  const [justStarted, setJustStarted] = useState(false);
  const startedContactRef = useRef<string | null>(null);
  const boardMoveAcceptedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (selectedId || !focusRequest || focusRequest.view !== view) return;
    const frame = window.requestAnimationFrame(() => {
      const prefix = view === "today" ? "queue-contact" : view === "new" ? "new-contact" : "process-contact";
      const fallbackId = view === "today" ? "queue-heading" : view === "new" ? "new-contacts-heading" : "process-heading";
      const contactTarget = document.getElementById(`${prefix}-${focusRequest.contactId}`);
      if (view === "process" && contactTarget) {
        const closedGroup = contactTarget.closest("details:not([open])");
        if (closedGroup instanceof HTMLDetailsElement) closedGroup.open = true;
      }
      const target = contactTarget ?? document.getElementById(fallbackId);
      target?.focus();
      if (view === "process" && contactTarget) contactTarget.scrollIntoView({ block: "nearest", inline: "nearest" });
      setFocusRequest(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [focusRequest, selectedId, view]);

  const selectedContact = useMemo(
    () => board.state?.contacts.find((contact) => contact.id === selectedId) ?? null,
    [board.state, selectedId],
  );

  function openContact(contact: Contact) {
    startedContactRef.current = null;
    setDetailOrigin(view);
    setSelectedId(contact.id);
    setFeedback(null);
    setNow(Date.now());
  }

  function applyMove(target: ColumnId): SubmitResult {
    if (!selectedContact) return { accepted: false, reason: "stale", message: "Kontakt už není dostupný. Otevřete jej znovu z fronty." };
    const result = board.moveContact(selectedContact.id, target);
    if (!result.accepted) {
      const message = rejectionMessage(result.reason);
      setFeedback({ title: "Změna se neprovedla", description: message, tone: "error" });
      setAnnouncement(message);
      return { accepted: false, reason: result.reason, message };
    }
    const cancelled = result.contact.history.some((entry) => entry.type === "activity_cancelled" && entry.at === result.at);
    const description = `Kontakt je nyní ve stavu „${COLUMN_LABEL_CS[result.contact.status]}“.${cancelled ? " Původní aktivita byla zrušena a zapsána do historie." : ""}`;
    const started = selectedContact.status === "backlog" && target === "to_call";
    if (started) {
      startedContactRef.current = selectedContact.id;
      setJustStarted(true);
    }
    setFeedback({ title: started ? "Zpracování kontaktu bylo zahájeno" : "Stav kontaktu byl změněn", description: started ? `${description} Kontakt je připravený k hovoru; žádný pokus ani termín nevznikl.` : description });
    setAnnouncement(description);
    return { accepted: true };
  }

  function requestMove(target: ColumnId) {
    if (!selectedContact) return;
    if (target === "to_call" && selectedContact.status === "backlog" && startedContactRef.current === selectedContact.id) return;
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

  function openInWork() {
    if (!selectedContact || selectedContact.status !== "to_call") return;
    const transition = openAcceptedContactInWork(selectedContact.id);
    ui.setView(transition.view);
    setDetailOrigin(transition.detailOrigin);
    setSelectedId(transition.selectedId);
    setFeedback(null);
    setAnnouncement(`${selectedContact.name} je otevřený v pracovním kontextu.`);
  }

  function handleOutcome(input: OutcomeInput): SubmitResult {
    if (!selectedContact) return { accepted: false, reason: "stale", message: "Kontakt už není dostupný. Otevřete jej znovu z fronty." };
    const result = board.recordOutcome(selectedContact.id, input);
    if (!result.accepted) return { accepted: false, reason: result.reason, message: rejectionMessage(result.reason) };
    const actual = result.contact;
    const attempt = actual.history.find((entry) => entry.type === "call_attempt" && entry.at === result.at);
    const nextStep = actual.nextActivity
      ? `${ACTIVITY_LABEL[actual.nextActivity.type]} · ${formatPragueDateTimePrecise(actual.nextActivity.dueAt)}`
      : "Žádná další aktivita";
    setFeedback({
      title: actual.status === "disqualified" ? "Kontakt byl vyřazen" : "Výsledek hovoru byl zaznamenán",
      description: `${attempt?.label ?? "Výsledek"}. Kontakt je nyní ve stavu „${COLUMN_LABEL_CS[actual.status]}“.`,
      nextStep,
    });
    setAnnouncement(`Výsledek hovoru byl zaznamenán: ${attempt?.label ?? "výsledek"}. Nový stav: ${COLUMN_LABEL_CS[actual.status]}. Další krok: ${nextStep}.`);
    return { accepted: true };
  }

  function handleSchedule(input: ScheduleInput): SubmitResult {
    if (!selectedContact) return { accepted: false, reason: "stale", message: "Kontakt už není dostupný. Otevřete jej znovu z fronty." };
    const result = board.scheduleActivity(selectedContact.id, input);
    if (!result.accepted) return { accepted: false, reason: result.reason, message: rejectionMessage(result.reason) };
    const actual = result.contact;
    const nextStep = actual.nextActivity
      ? `${ACTIVITY_LABEL[actual.nextActivity.type]} · ${formatPragueDateTimePrecise(actual.nextActivity.dueAt)}`
      : "Žádná další aktivita";
    setFeedback({ title: "Termín byl nastaven v demu", description: `Procesní stav: „${COLUMN_LABEL_CS[actual.status]}“.`, nextStep });
    setAnnouncement(`Termín další aktivity je nastaven: ${nextStep}.`);
    return { accepted: true };
  }

  function requestBoardMove(draft: ContactMoveDraft, focusId: string) {
    boardMoveAcceptedRef.current = false;
    setNow(Date.now());
    setPendingBoardMove({ draft, focusId });
    setBoardNotice("");
    setAnnouncement(`Otevřen návrh přesunu kontaktu ${draft.contactName} z ${COLUMN_LABEL_CS[draft.source]} do ${COLUMN_LABEL_CS[draft.target]}.`);
  }

  function closeBoardMove() {
    const pending = pendingBoardMove;
    const accepted = boardMoveAcceptedRef.current;
    boardMoveAcceptedRef.current = false;
    setPendingBoardMove(null);
    if (!accepted && pending) {
      window.requestAnimationFrame(() => document.getElementById(pending.focusId)?.focus());
    }
  }

  function confirmBoardMove(draft: ContactMoveDraft, activity?: ScheduleInput): SubmitResult {
    const result = board.confirmMove(draft, activity);
    if (!result.accepted) {
      const message = rejectionMessage(result.reason);
      setAnnouncement(message);
      return { accepted: false, reason: result.reason, message };
    }
    const actual = result.contact;
    const activityEvent = actual.history.find((entry) => entry.at === result.at && (entry.type === "activity_scheduled" || entry.type === "activity_cancelled"));
    const description = `Kontakt ${actual.name} byl přesunut do stavu „${COLUMN_LABEL_CS[actual.status]}“.${activityEvent ? ` ${activityEvent.label}.` : ""}`;
    boardMoveAcceptedRef.current = true;
    setBoardNotice(description);
    setAnnouncement(description);
    setFocusRequest({ contactId: actual.id, view: "process" });
    return { accepted: true };
  }

  function refreshBoardMoveDraft(): boolean {
    if (!pendingBoardMove) return false;
    const refreshed = board.getMoveDraft(pendingBoardMove.draft.contactId, pendingBoardMove.draft.target);
    if (!refreshed) return false;
    setPendingBoardMove({ ...pendingBoardMove, draft: refreshed });
    setNow(Date.now());
    setAnnouncement(`Návrh přesunu kontaktu ${refreshed.contactName} byl aktualizován podle současných dat.`);
    return true;
  }

  function resetDemo() {
    board.resetDemo();
    setJustStarted(false);
    ui.reset();
    closeDetail("today");
    setAnnouncement("Demo bylo obnoveno do výchozího stavu.");
    setBoardNotice("");
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
      {view === "today" ? <TodayView contacts={board.state.contacts} now={now} filters={filters} selectedId={selectedId} onFiltersChange={ui.setFilters} onOpenContact={openContact} onResetDemo={() => setResetOpen(true)} onGoToNew={() => ui.setView("new")} /> : view === "new" ? <NewContactsView contacts={board.state.contacts} filters={newFilters} selectedId={selectedId} onFiltersChange={ui.setNewFilters} onOpenContact={openContact} onResetDemo={() => setResetOpen(true)} onGoToQueue={() => ui.setView("today")} justStarted={justStarted} /> : <ProcessBoard contacts={board.state.contacts} now={now} filters={filters} selectedId={selectedId} onOpenContact={openContact} onRequestMove={requestBoardMove} onResetDemo={() => setResetOpen(true)} onGoToNew={() => ui.setView("new")} />}

      {boardNotice ? <div role="status" className="content-surface fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-xl items-start justify-between gap-3 p-4 shadow-xl sm:left-auto sm:right-6"><p className="dc-text-primary text-sm font-medium leading-relaxed">{boardNotice}</p><button type="button" onClick={() => setBoardNotice("")} className="button-quiet h-9 shrink-0 px-2 text-xs">Skrýt</button></div> : null}

      {selectedContact ? (
        <ContactDetail
          contact={selectedContact}
          now={now}
          active={!outcomeOpen && !scheduleOpen && pendingMove === null}
          feedback={feedback}
          onClose={() => closeDetail()}
          originView={detailOrigin}
          onBackToOrigin={() => closeDetail(detailOrigin)}
          onOpenInWork={openInWork}
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
      {pendingBoardMove ? (
        <MoveConfirmationModal draft={pendingBoardMove.draft} now={now} onClose={closeBoardMove} onConfirm={confirmBoardMove} onRefreshDraft={refreshBoardMoveDraft} />
      ) : null}
      {resetOpen ? <ResetDemoModal onClose={() => setResetOpen(false)} onConfirm={resetDemo} /> : null}
      </main>
    </>
  );
}
