"use client";

import { useCallback, useEffect, useState } from "react";
import type { ColumnId, ContactSource } from "./types";

export const CALLING_UI_STORAGE_KEY = "obvolavani-portfolio-ui-v1";
export const CALLING_UI_SCHEMA_VERSION = 1;

export type CallingView = "today" | "process" | "new";
export type QueueFilters = {
  query: string;
  source: "all" | ContactSource;
  status: "all" | ColumnId;
};
export type NewContactFilters = {
  query: string;
  city: string;
  type: "all" | "prodej" | "pronajem";
  subtype: string;
  source: "all" | ContactSource;
  sort: "newest" | "oldest";
};

export const DEFAULT_NEW_CONTACT_FILTERS: NewContactFilters = {
  query: "", city: "all", type: "all", subtype: "all", source: "all", sort: "newest",
};

export type CallingUiState = {
  schemaVersion: typeof CALLING_UI_SCHEMA_VERSION;
  view: CallingView;
  filters: QueueFilters;
  newFilters: NewContactFilters;
};

const SOURCES: ContactSource[] = ["inzerce", "tipar", "fb", "callcentrum"];
const FILTERABLE_STATUSES: ColumnId[] = ["backlog", "to_call", "call_later", "meeting"];

export function createDefaultCallingUiState(): CallingUiState {
  return {
    schemaVersion: CALLING_UI_SCHEMA_VERSION,
    view: "today",
    filters: { query: "", source: "all", status: "all" },
    newFilters: { ...DEFAULT_NEW_CONTACT_FILTERS },
  };
}

export function restoreCallingUiState(serialized: string | null): CallingUiState {
  if (!serialized) return createDefaultCallingUiState();
  try {
    const parsed = JSON.parse(serialized) as Partial<CallingUiState>;
    const filters = parsed.filters as Partial<QueueFilters> | undefined;
    if (
      parsed.schemaVersion !== CALLING_UI_SCHEMA_VERSION ||
      (parsed.view !== "today" && parsed.view !== "process" && parsed.view !== "new") ||
      !filters ||
      typeof filters.query !== "string" ||
      filters.query.length > 200 ||
      (filters.source !== "all" && !SOURCES.includes(filters.source as ContactSource)) ||
      (filters.status !== "all" && !FILTERABLE_STATUSES.includes(filters.status as ColumnId))
    ) {
      return createDefaultCallingUiState();
    }
    const savedNew = parsed.newFilters as Partial<NewContactFilters> | undefined;
    const newFilters: NewContactFilters = savedNew &&
      typeof savedNew.query === "string" && savedNew.query.length <= 200 &&
      typeof savedNew.city === "string" && savedNew.city.length <= 100 &&
      typeof savedNew.subtype === "string" && savedNew.subtype.length <= 100 &&
      (savedNew.type === "all" || savedNew.type === "prodej" || savedNew.type === "pronajem") &&
      (savedNew.source === "all" || SOURCES.includes(savedNew.source as ContactSource)) &&
      (savedNew.sort === "newest" || savedNew.sort === "oldest")
      ? savedNew as NewContactFilters : { ...DEFAULT_NEW_CONTACT_FILTERS };
    return {
      schemaVersion: CALLING_UI_SCHEMA_VERSION,
      view: parsed.view,
      filters: {
        query: filters.query,
        source: filters.source as QueueFilters["source"],
        status: filters.status === "backlog" ? "all" : filters.status as QueueFilters["status"],
      },
      newFilters,
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

  const setNewFilters = useCallback((newFilters: NewContactFilters) => {
    setState((current) => ({ ...current, newFilters }));
  }, []);

  const reset = useCallback(() => {
    setState(createDefaultCallingUiState());
  }, []);

  return { state, setView, setFilters, setNewFilters, reset };
}
