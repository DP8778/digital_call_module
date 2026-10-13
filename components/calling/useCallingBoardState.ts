"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  persistDemoState,
  readDemoState,
  resetDemoState,
  type PersistenceState,
  type StorageNotice,
} from "./callingStorage";
import {
  applyTimeRules,
  moveContact as moveContactInState,
  recordCallOutcome,
  scheduleActivity as scheduleActivityInState,
} from "./stateLogic";
import type { ColumnId, DemoState, OutcomeInput, ScheduleInput } from "./types";

function getLocalStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function useCallingBoardState() {
  const [state, setState] = useState<DemoState | null>(null);
  const [persistence, setPersistence] = useState<PersistenceState>("initializing");
  const [storageNotice, setStorageNotice] = useState<StorageNotice>(null);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      const restored = readDemoState(getLocalStorage(), Date.now());
      setPersistence(restored.persistence);
      setStorageNotice(restored.notice);
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
      setState((current) => (current ? applyTimeRules(current, Date.now()) : current));
    }, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const moveContact = useCallback((contactId: string, target: ColumnId) => {
    setState((current) =>
      current ? moveContactInState(current, contactId, target, Date.now()) : current,
    );
  }, []);

  const recordOutcome = useCallback((contactId: string, input: OutcomeInput) => {
    setState((current) =>
      current ? recordCallOutcome(current, contactId, input, Date.now()) : current,
    );
  }, []);

  const scheduleActivity = useCallback((contactId: string, input: ScheduleInput) => {
    setState((current) =>
      current ? scheduleActivityInState(current, contactId, input, Date.now()) : current,
    );
  }, []);

  const resetDemo = useCallback(() => {
    const reset = resetDemoState(getLocalStorage(), Date.now());
    setPersistence(reset.persistence);
    setStorageNotice(reset.notice);
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
    resetDemo,
  };
}
