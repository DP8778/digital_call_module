import type { CallingView } from "./uiState";

export function openAcceptedContactInWork(contactId: string) {
  return { selectedId: contactId, view: "today" as CallingView, detailOrigin: "today" as CallingView };
}
