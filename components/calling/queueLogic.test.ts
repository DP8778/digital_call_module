import { describe, expect, it } from "vitest";
import { createDemoState } from "./mockContacts";
import { filterQueueContacts, formatAttemptCount, formatCzechCount, getFirstAttentionContact, getQueueGroup, getQueueSummary, sortQueueContacts } from "./queueLogic";
import { getQueuePresentation } from "./queuePresentation";
import { parsePragueDateTime } from "./time";

const NOW = parsePragueDateTime("2026-10-12T13:00")!;

function withDueAt(dueAt: number) {
  const base = createDemoState(NOW).contacts[0];
  return {
    ...base,
    nextActivity: { id: "test-activity", type: "call" as const, dueAt },
  };
}

describe("seskupení pracovní fronty", () => {
  it("zařadí dnešní termín před aktuálním časem mezi zmeškané", () => {
    const dueAt = parsePragueDateTime("2026-10-12T10:00")!;
    expect(getQueueGroup(withDueAt(dueAt), NOW)).toBe("missed");
  });

  it("ponechá budoucí dnešní termín ve skupině Dnes", () => {
    const dueAt = parsePragueDateTime("2026-10-12T16:00")!;
    expect(getQueueGroup(withDueAt(dueAt), NOW)).toBe("today");
  });

  it("respektuje půlnoc v Europe/Prague", () => {
    const beforeMidnight = parsePragueDateTime("2026-10-12T23:59")!;
    const afterMidnight = parsePragueDateTime("2026-10-13T00:01")!;
    expect(getQueueGroup(withDueAt(beforeMidnight), afterMidnight)).toBe("missed");
    expect(getQueueGroup(withDueAt(afterMidnight), beforeMidnight)).toBe("later");
  });

  it("používá správné české tvary počtů", () => {
    expect(formatAttemptCount(0)).toBe("0 pokusů");
    expect(formatAttemptCount(1)).toBe("1 pokus");
    expect(formatAttemptCount(2)).toBe("2 pokusy");
    expect(formatAttemptCount(4)).toBe("4 pokusy");
    expect(formatAttemptCount(5)).toBe("5 pokusů");
    expect(formatCzechCount(1, ["úkol", "úkoly", "úkolů"])).toBe("1 úkol");
  });

  it("neskryje naléhavou práci z celkového souhrnu aktivním filtrem", () => {
    const contacts = createDemoState(NOW).contacts;
    const selection = filterQueueContacts(contacts, {
      query: "David Soukup",
      source: "all",
      status: "all",
    });
    const summary = getQueueSummary(contacts, selection, NOW);

    expect(selection).toHaveLength(1);
    expect(summary.selectionAttention).toBe(0);
    expect(summary.attentionTotal).toBeGreaterThan(0);
  });

  it("oddělí prošlé termíny a připravený hovor v globálním souhrnu", () => {
    const base = createDemoState(NOW).contacts[0];
    const overdue = { ...withDueAt(parsePragueDateTime("2026-10-12T10:00")!), id: "overdue" };
    const ready = { ...base, id: "ready", status: "to_call" as const, nextActivity: null };
    const today = { ...withDueAt(parsePragueDateTime("2026-10-12T16:00")!), id: "today" };
    const missing = { ...base, id: "missing", status: "backlog" as const, nextActivity: null };
    const contacts = [overdue, ready, today, missing];
    const summary = getQueueSummary(contacts, [today, missing], NOW);

    expect(summary).toMatchObject({
      attentionTotal: 2,
      overdueTotal: 1,
      readyNowTotal: 1,
      todayRemainingTotal: 1,
      selectionAttention: 0,
      selectionResults: 2,
    });
    expect(summary.attentionTotal).toBe(summary.overdueTotal + summary.readyNowTotal);
  });

  it("vrací strukturovaný význam bez parsování důvodu pozornosti", () => {
    const base = createDemoState(NOW).contacts[0];
    const overdueAt = parsePragueDateTime("2026-10-12T10:00")!;
    const todayAt = parsePragueDateTime("2026-10-12T16:00")!;
    const laterAt = parsePragueDateTime("2026-10-13T09:00")!;

    expect(getQueuePresentation(withDueAt(overdueAt), NOW)).toMatchObject({ kind: "overdue", badge: "Po termínu", activity: "Hovor", dueAt: overdueAt });
    expect(getQueuePresentation({ ...base, nextActivity: null }, NOW)).toMatchObject({ kind: "ready", badge: "Připraveno nyní", dueAt: null });
    expect(getQueuePresentation(withDueAt(todayAt), NOW)).toMatchObject({ kind: "today", badge: "Dnes", dueAt: todayAt });
    expect(getQueuePresentation(withDueAt(laterAt), NOW)).toMatchObject({ kind: "later", badge: null, dueAt: laterAt });
    expect(getQueuePresentation({ ...base, status: "backlog", nextActivity: null }, NOW)).toMatchObject({ kind: "new", badge: null, activity: "Dosud nezahájeno", dueAt: null });
    expect(getQueuePresentation({ ...base, status: "listed", nextActivity: null }, NOW)).toMatchObject({ kind: "closed", badge: null, dueAt: null });
  });

  it("otevře první naléhavý kontakt podle pořadí viditelné fronty a aktivního filtru", () => {
    const contacts = createDemoState(NOW).contacts;
    const all = sortQueueContacts(filterQueueContacts(contacts, { query: "", source: "all", status: "all" }));
    const firstVisibleUrgent = all.filter((contact) => getQueueGroup(contact, NOW) === "missed")[0];
    expect(getFirstAttentionContact(all, NOW)?.id).toBe(firstVisibleUrgent.id);

    const filtered = filterQueueContacts(contacts, { query: "", source: "inzerce", status: "meeting" });
    expect(filtered).toHaveLength(1);
    expect(getFirstAttentionContact(filtered, NOW)?.id).toBe(filtered[0].id);
  });

  it("při prázdném nebo nenaléhavém výběru neotevře jiný kontakt ani koncový stav", () => {
    const contacts = createDemoState(NOW).contacts;
    const noMatch = filterQueueContacts(contacts, { query: "neexistující kontakt", source: "all", status: "all" });
    const nonUrgent = filterQueueContacts(contacts, { query: "David Soukup", source: "all", status: "all" });
    const terminal = contacts.filter((contact) => contact.status === "listed" || contact.status === "disqualified");
    expect(getFirstAttentionContact(noMatch, NOW)).toBeNull();
    expect(getFirstAttentionContact(nonUrgent, NOW)).toBeNull();
    expect(getFirstAttentionContact(terminal, NOW)).toBeNull();
  });

  it("dá prošlému termínu přednost před připraveným hovorem bez termínu", () => {
    const base = createDemoState(NOW).contacts[0];
    const ready = { ...base, id: "ready", status: "to_call" as const, nextActivity: null };
    const overdue = { ...withDueAt(parsePragueDateTime("2026-10-12T12:00")!), id: "overdue" };
    expect(getFirstAttentionContact([ready, overdue], NOW)?.id).toBe("overdue");
    expect(getFirstAttentionContact([ready], NOW)?.id).toBe("ready");
  });
});
