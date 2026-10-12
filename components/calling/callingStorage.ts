import { createDemoState } from "./mockContacts";
import { DEMO_STORAGE_KEY, restoreDemoState } from "./stateLogic";
import type { DemoState } from "./types";

export type StorageNotice = "recovered" | "unavailable" | null;

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

export function readDemoState(
  storage: ReadableStorage | null,
  now: number,
): { state: DemoState; notice: StorageNotice } {
  try {
    if (!storage) throw new Error("Storage is unavailable");
    const restored = restoreDemoState(storage.getItem(DEMO_STORAGE_KEY), now);
    return { state: restored.state, notice: restored.recovered ? "recovered" : null };
  } catch {
    return { state: createDemoState(now), notice: "unavailable" };
  }
}

export function persistDemoState(storage: WritableStorage | null, state: DemoState): boolean {
  try {
    if (!storage) return false;
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function resetDemoState(
  storage: WritableStorage | null,
  now: number,
): { state: DemoState; notice: StorageNotice } {
  const state = createDemoState(now);
  return {
    state,
    notice: persistDemoState(storage, state) ? null : "unavailable",
  };
}
