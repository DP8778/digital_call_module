import { createDemoState } from "./mockContacts";
import { DEMO_STORAGE_KEY, restoreDemoState } from "./stateLogic";
import type { DemoState } from "./types";

export type DemoReadStatus = "missing" | "invalid" | "unavailable" | "valid";
export type PersistenceState = "initializing" | "enabled" | "read-unavailable" | "write-unavailable";
export type StorageNotice = "recovered" | "read-unavailable" | "write-unavailable" | null;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

export function readDemoState(
  storage: ReadableStorage | null,
  now: number,
): {
  state: DemoState;
  readStatus: DemoReadStatus;
  persistence: Exclude<PersistenceState, "initializing" | "write-unavailable">;
  notice: StorageNotice;
} {
  try {
    if (!storage) throw new Error("Storage is unavailable");
    const serialized = storage.getItem(DEMO_STORAGE_KEY);
    if (serialized === null) {
      return {
        state: createDemoState(now),
        readStatus: "missing",
        persistence: "enabled",
        notice: null,
      };
    }
    const restored = restoreDemoState(serialized, now);
    return {
      state: restored.state,
      readStatus: restored.recovered ? "invalid" : "valid",
      persistence: "enabled",
      notice: restored.recovered ? "recovered" : null,
    };
  } catch {
    return {
      state: createDemoState(now),
      readStatus: "unavailable",
      persistence: "read-unavailable",
      notice: "read-unavailable",
    };
  }
}

export function persistDemoState(
  storage: WritableStorage | null,
  state: DemoState,
  persistence: PersistenceState,
): { status: "saved" | "skipped" | "failed"; persistence: PersistenceState } {
  if (persistence !== "enabled") {
    return { status: "skipped", persistence };
  }
  try {
    if (!storage) throw new Error("Storage is unavailable");
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    return { status: "saved", persistence: "enabled" };
  } catch {
    return { status: "failed", persistence: "write-unavailable" };
  }
}

export function resetDemoState(
  storage: WritableStorage | null,
  now: number,
): { state: DemoState; persistence: PersistenceState; notice: StorageNotice } {
  const state = createDemoState(now);
  const result = persistDemoState(storage, state, "enabled");
  return {
    state,
    persistence: result.persistence,
    notice: result.status === "saved" ? null : "write-unavailable",
  };
}
