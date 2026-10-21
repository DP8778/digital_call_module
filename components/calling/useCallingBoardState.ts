"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  persistDemoState,
  readDemoState,
  resetDemoState,
  type PersistenceState,
  type StorageNotice,
} from "./callingStorage";
import {
  applyBoardOperation,
  applyTimeRules,
  createContactMoveDraft,
  type BoardOperation,
  type BoardOperationResult,
} from "./stateLogic";
import type { ColumnId, DemoState, OutcomeInput, ScheduleInput } from "./types";
import type { ContactMoveDraft } from "./types";

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useCallingBoardState() {
  const [state, setState] = useState<DemoState | null>(null);
  const stateRef = useRef<DemoState | null>(null);
  const [persistence, setPersistence] = useState<PersistenceState>("initializing");
  const [storageNotice, setStorageNotice] = useState<StorageNotice>(null);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      const restored = readDemoState(getLocalStorage(), Date.now());
      setPersistence(restored.persistence);
      setStorageNotice(restored.notice);
      stateRef.current = restored.state;
      setState(restored.state);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!state || persistence === "initializing") return;
    const result = persistDemoState(getLocalStorage(), state, persistence);
    if (result.status === "failed") {
      window.queueMicrotask(() => {
        setPersistence(result.persistence);
        setStorageNotice("write-unavailable");
      });
    }
  }, [persistence, state]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = stateRef.current;
      if (!current) return;
      const next = applyTimeRules(current, Date.now());
      if (next !== current) {
        stateRef.current = next;
        setState(next);
      }
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const commit = useCallback((operation: BoardOperation): BoardOperationResult => {
    const now = Date.now();
    const current = stateRef.current;
    const currentWithTimeRules = current ? applyTimeRules(current, now) : null;
    if (currentWithTimeRules !== current) {
      stateRef.current = currentWithTimeRules;
      setState(currentWithTimeRules);
    }
    const result = applyBoardOperation(currentWithTimeRules, operation, now);
    if (result.accepted) {
      stateRef.current = result.state;
      setState(result.state);
    }
    return result;
  }, []);

  const moveContact = useCallback((contactId: string, target: ColumnId) =>
    commit({ kind: "move", contactId, target }), [commit]);

  const recordOutcome = useCallback((contactId: string, input: OutcomeInput) =>
    commit({ kind: "outcome", contactId, input }), [commit]);

  const scheduleActivity = useCallback((contactId: string, input: ScheduleInput) =>
    commit({ kind: "schedule", contactId, input }), [commit]);

  const confirmMove = useCallback((draft: ContactMoveDraft, activity?: ScheduleInput) =>
    commit({ kind: "confirm_move", draft, activity }), [commit]);

  const getMoveDraft = useCallback((contactId: string, target: ColumnId): ContactMoveDraft | null => {
    const current = stateRef.current;
    if (!current) return null;
    const currentWithTimeRules = applyTimeRules(current, Date.now());
    if (currentWithTimeRules !== current) {
      stateRef.current = currentWithTimeRules;
      setState(currentWithTimeRules);
    }
    const contact = currentWithTimeRules.contacts.find((item) => item.id === contactId);
    return contact ? createContactMoveDraft(contact, target) : null;
  }, []);

  const resetDemo = useCallback(() => {
    const reset = resetDemoState(getLocalStorage(), Date.now());
    setPersistence(reset.persistence);
    setStorageNotice(reset.notice);
    stateRef.current = reset.state;
    setState(reset.state);
  }, []);

  const contactsByStatus = useMemo(() => {
    const empty: Record<ColumnId, NonNullable<DemoState>["contacts"]> = {
      backlog: [],
      to_call: [],
      call_later: [],
      meeting: [],
      listed: [],
      disqualified: [],
    };
    if (!state) return empty;
    for (const contact of state.contacts) empty[contact.status].push(contact);
    return empty;
  }, [state]);

  return {
    state,
    contactsByStatus,
    storageNotice,
    dismissStorageNotice: () => setStorageNotice(null),
    moveContact,
    recordOutcome,
    scheduleActivity,
    confirmMove,
    getMoveDraft,
    resetDemo,
  };
}
