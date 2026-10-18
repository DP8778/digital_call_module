import { describe, expect, it } from "vitest";
import { openAcceptedContactInWork } from "./detailNavigation";
import { createDemoState } from "./mockContacts";
import { availableValues } from "./newContactOptions";
import { filterNewContacts } from "./newContactsLogic";
import { filterQueueContacts } from "./queueLogic";
import { applyBoardOperation } from "./stateLogic";
import { parsePragueDateTime } from "./time";
import { DEFAULT_NEW_CONTACT_FILTERS } from "./uiState";

const NOW = parsePragueDateTime("2026-10-12T12:00")!;

describe("návaznost nových kontaktů", () => {
  it("ponechá zvolenou hodnotu selectů dostupnou i po odchodu poslední shody", () => {
    const initial = createDemoState(NOW);
    const accepted = applyBoardOperation(initial, { kind: "move", contactId: "demo-13", target: "to_call" }, NOW + 1_000);
    expect(accepted.accepted).toBe(true);
    if (!accepted.accepted) return;
    const filters = { ...DEFAULT_NEW_CONTACT_FILTERS, city: "Praha 7", subtype: "Byt 2+kk", source: "fb" as const };
    expect(filterNewContacts(accepted.state.contacts, filters)).toHaveLength(0);
    expect(availableValues(accepted.state.contacts, "city", filters.city)).toContain(filters.city);
    expect(availableValues(accepted.state.contacts, "subtype", filters.subtype)).toContain(filters.subtype);
    expect(availableValues(accepted.state.contacts, "source", filters.source)).toContain(filters.source);
  });

  it("otevře přijatý kontakt v práci i když jej původní filtr fronty skrývá", () => {
    const initial = createDemoState(NOW);
    const accepted = applyBoardOperation(initial, { kind: "move", contactId: "demo-13", target: "to_call" }, NOW + 1_000);
    expect(accepted.accepted).toBe(true);
    if (!accepted.accepted) return;
    const previousQueueSelection = filterQueueContacts(accepted.state.contacts, { query: "Anna", source: "all", status: "all" });
    expect(previousQueueSelection.some((contact) => contact.id === "demo-13")).toBe(false);
    expect(openAcceptedContactInWork("demo-13")).toEqual({ selectedId: "demo-13", view: "today", detailOrigin: "today" });
    expect(accepted.state.contacts.find((contact) => contact.id === "demo-13")?.status).toBe("to_call");
  });
});
