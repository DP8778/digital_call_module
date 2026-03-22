import { pointerWithin, type CollisionDetection, type Over } from "@dnd-kit/core";
import type { ColumnId } from "./types";

export const COLUMN_CONTAINER_IDS = new Set<string>([
  "backlog",
  "to_call",
  "meeting",
  "call_later",
  "listed",
  "disqualified",
]);

function isColumnContainerId(id: unknown): id is ColumnId {
  return typeof id === "string" && COLUMN_CONTAINER_IDS.has(id);
}

/** Sloupec z aktivního drop cíle (po kolizi podle pointeru). */
export function dropTargetColumnId(over: Over | null): ColumnId | undefined {
  if (!over) return undefined;
  const fromData = over.data.current?.columnId;
  if (typeof fromData === "string" && COLUMN_CONTAINER_IDS.has(fromData)) {
    return fromData as ColumnId;
  }
  if (isColumnContainerId(over.id)) {
    return over.id;
  }
  return undefined;
}

/**
 * Drop podle pozice kurzoru / touch bodu ve vizuálním kontejneru sloupce.
 * Vyloučí sortable id karet — zůstane jen sloupec, jehož bounding box obsahuje pointer.
 */
export const columnContainerPointerCollision: CollisionDetection = (args) => {
  return pointerWithin(args).filter((c) => isColumnContainerId(c.id));
};
