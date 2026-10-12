"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createDemoState } from "./mockContacts";
import {
  applyTimeRules,
  DEMO_STORAGE_KEY,
  moveContact as moveContactInState,
  recordCallOutcome,
  restoreDemoState,
  scheduleActivity as scheduleActivityInState,
} from "./stateLogic";
import type { ColumnId, DemoState, OutcomeInput, ScheduleInput } from "./types";

export function useCallingBoardState() {
  const [state, setState] = useState<DemoState | null>(null);
  const [storageRecovered, setStorageRecovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      const restored = restoreDemoState(window.localStorage.getItem(DEMO_STORAGE_KEY), Date.now());
      setStorageRecovered(restored.recovered);
      setState(restored.state);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    } catch {
      window.queueMicrotask(() => setStorageRecovered(true));
    }
  }, [state]);

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
    const fresh = createDemoState(Date.now());
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(fresh));
    setStorageRecovered(false);
    setState(fresh);
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
    storageRecovered,
    dismissStorageWarning: () => setStorageRecovered(false),
    moveContact,
    recordOutcome,
    scheduleActivity,
    resetDemo,
  };
}
