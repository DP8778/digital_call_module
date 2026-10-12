"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnId, ContactSource } from "./types";

export const CALLING_UI_STORAGE_KEY = "obvolavani-portfolio-ui-v1";
export const CALLING_UI_SCHEMA_VERSION = 1;

export type CallingView = "today" | "process";
export type QueueFilters = {
  query: string;
  source: "all" | ContactSource;
  status: "all" | ColumnId;
};

export type CallingUiState = {
  schemaVersion: typeof CALLING_UI_SCHEMA_VERSION;
  view: CallingView;
  filters: QueueFilters;
};

const SOURCES: ContactSource[] = ["inzerce", "tipar", "fb", "callcentrum"];
const FILTERABLE_STATUSES: ColumnId[] = ["backlog", "to_call", "call_later", "meeting"];

export function createDefaultCallingUiState(): CallingUiState {
  return {
    schemaVersion: CALLING_UI_SCHEMA_VERSION,
    view: "today",
    filters: { query: "", source: "all", status: "all" },
  };
}

export function restoreCallingUiState(serialized: string | null): CallingUiState {
  if (!serialized) return createDefaultCallingUiState();
  try {
    const parsed = JSON.parse(serialized) as Partial<CallingUiState>;
    const filters = parsed.filters as Partial<QueueFilters> | undefined;
    if (
      parsed.schemaVersion !== CALLING_UI_SCHEMA_VERSION ||
      (parsed.view !== "today" && parsed.view !== "process") ||
      !filters ||
      typeof filters.query !== "string" ||
      filters.query.length > 200 ||
      (filters.source !== "all" && !SOURCES.includes(filters.source as ContactSource)) ||
      (filters.status !== "all" && !FILTERABLE_STATUSES.includes(filters.status as ColumnId))
    ) {
      return createDefaultCallingUiState();
    }
    return {
      schemaVersion: CALLING_UI_SCHEMA_VERSION,
      view: parsed.view,
      filters: {
        query: filters.query,
        source: filters.source as QueueFilters["source"],
        status: filters.status as QueueFilters["status"],
      },
    };
  } catch {
    return createDefaultCallingUiState();
  }
}

export function readCallingUiState(storage: Pick<Storage, "getItem"> | null): CallingUiState {
  try {
    if (!storage) return createDefaultCallingUiState();
    return restoreCallingUiState(storage.getItem(CALLING_UI_STORAGE_KEY));
  } catch {
    return createDefaultCallingUiState();
  }
}

export function useCallingUiState() {
  const [state, setState] = useState<CallingUiState>(createDefaultCallingUiState);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.queueMicrotask(() => {
      if (cancelled) return;
      let storage: Storage | null = null;
      try {
        storage = window.sessionStorage;
      } catch {
        // A blocked storage object is equivalent to an empty UI session.
      }
      setState(readCallingUiState(storage));
      setRestored(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(CALLING_UI_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // UI state remains usable in memory when session storage is unavailable.
    }
  }, [restored, state]);

  const setView = useCallback((view: CallingView) => {
    setState((current) => ({ ...current, view }));
  }, []);

  const setFilters = useCallback((filters: QueueFilters) => {
    setState((current) => ({ ...current, filters }));
  }, []);

  const reset = useCallback(() => {
    setState(createDefaultCallingUiState());
  }, []);

  return { state, setView, setFilters, reset };
}
