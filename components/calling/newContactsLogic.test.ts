import { describe, expect, it } from "vitest";
import { createDemoState } from "./mockContacts";
import { filterNewContacts, getNewContacts } from "./newContactsLogic";
import { filterQueueContacts, getQueueSummary } from "./queueLogic";
import { applyBoardOperation, getAttemptCount } from "./stateLogic";
import { parsePragueDateTime } from "./time";
import { DEFAULT_NEW_CONTACT_FILTERS } from "./uiState";

const NOW = parsePragueDateTime("2026-10-12T12:00")!;

describe("nové kontakty", () => {
  it("kombinuje hledání, lokalitu, nabídku, nemovitost a zdroj; řadí podle data", () => {
    const contacts = createDemoState(NOW).contacts;
    const filters = { ...DEFAULT_NEW_CONTACT_FILTERS, query: "byt", city: "Praha 7", type: "pronajem" as const, subtype: "Byt 2+kk", source: "fb" as const };
    expect(filterNewContacts(contacts, filters).map((contact) => contact.id)).toEqual(["demo-13"]);
    const newest = filterNewContacts(contacts, DEFAULT_NEW_CONTACT_FILTERS);
    const oldest = filterNewContacts(contacts, { ...DEFAULT_NEW_CONTACT_FILTERS, sort: "oldest" });
    expect(newest.map((contact) => contact.id)).toEqual([...oldest].reverse().map((contact) => contact.id));
    expect(newest[0].createdAt).toBeGreaterThan(newest.at(-1)!.createdAt);
  });

  it("odděluje zásobník od práce, ale ponechává jej v celém procesu", () => {
    const contacts = createDemoState(NOW).contacts;
    const backlog = getNewContacts(contacts);
    const queue = filterQueueContacts(contacts, { query: "", source: "all", status: "all" });
    expect(backlog.length).toBeGreaterThan(2);
    expect(queue.every((contact) => contact.status !== "backlog")).toBe(true);
    expect(contacts.filter((contact) => contact.status === "backlog")).toHaveLength(backlog.length);
    expect(getQueueSummary(contacts, queue, NOW).attentionTotal).toBe(queue.filter((contact) => contact.status === "to_call" && !contact.nextActivity || Boolean(contact.nextActivity && contact.nextActivity.dueAt < NOW)).length);
  });

  it("zahájení se projeví ve všech třech pohledech, bez pokusu a termínu; opakování odmítne", () => {
    const before = createDemoState(NOW);
    const id = "demo-13";
    const original = before.contacts.find((contact) => contact.id === id)!;
    const result = applyBoardOperation(before, { kind: "move", contactId: id, target: "to_call" }, NOW + 1_000);
    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(getNewContacts(result.state.contacts).some((contact) => contact.id === id)).toBe(false);
    expect(filterQueueContacts(result.state.contacts, { query: "", source: "all", status: "all" }).some((contact) => contact.id === id)).toBe(true);
    expect(result.state.contacts.find((contact) => contact.id === id)?.status).toBe("to_call");
    expect(result.contact.history[0].type).toBe("status_change");
    expect(getAttemptCount(result.contact)).toBe(getAttemptCount(original));
    expect(result.contact.nextActivity).toBeNull();
    expect(applyBoardOperation(result.state, { kind: "move", contactId: id, target: "to_call" }, NOW + 2_000)).toMatchObject({ accepted: false, reason: "stale" });
  });
});
