import { describe, expect, it } from "vitest";
import { createDemoState } from "./mockContacts";
import {
  applyTimeRules,
  CALL_READY_GRACE_MS,
  getAttemptCount,
  moveContact,
  recordCallOutcome,
  restoreDemoState,
  scheduleActivity,
} from "./stateLogic";
import { parsePragueDateTime } from "./time";

const NOW = parsePragueDateTime("2026-10-12T12:00")!;

function contact(state: ReturnType<typeof createDemoState>, id: string) {
  const found = state.contacts.find((item) => item.id === id);
  if (!found) throw new Error(`Chybí testovací kontakt ${id}`);
  return found;
}

describe("stavová logika dema", () => {
  it("přesun kontaktu nevytváří pokus", () => {
    const initial = createDemoState(NOW);
    const before = getAttemptCount(contact(initial, "demo-7"));
    const moved = moveContact(initial, "demo-7", "to_call", NOW + 1_000);

    expect(contact(moved, "demo-7").status).toBe("to_call");
    expect(getAttemptCount(contact(moved, "demo-7"))).toBe(before);
    expect(moved.contacts).toHaveLength(initial.contacts.length);
    expect(new Set(moved.contacts.map((item) => item.id)).size).toBe(moved.contacts.length);
  });

  it("nepovolený přesun nechá stav beze změny", () => {
    const initial = createDemoState(NOW);
    expect(moveContact(initial, "demo-7", "listed", NOW + 1_000)).toBe(initial);
  });

  it("započítá pokus pouze při uložení výsledku", () => {
    const initial = createDemoState(NOW);
    const before = getAttemptCount(contact(initial, "demo-4"));
    const next = recordCallOutcome(initial, "demo-4", { outcome: "no_answer", note: "Bez odezvy" }, NOW);
    const updated = contact(next, "demo-4");

    expect(getAttemptCount(updated)).toBe(before + 1);
    expect(updated.status).toBe("call_later");
    expect(updated.nextActivity?.type).toBe("call");
    expect(updated.nextActivity?.dueAt).toBeGreaterThan(NOW);
  });

  it("naplánování aktivity nemění procesní stav", () => {
    const initial = createDemoState(NOW);
    const dueAt = NOW + 2 * 60 * 60_000;
    const next = scheduleActivity(initial, "demo-7", { activityType: "meeting", dueAt }, NOW);

    expect(contact(next, "demo-7").status).toBe("backlog");
    expect(contact(next, "demo-7").nextActivity).toMatchObject({ type: "meeting", dueAt });
  });

  it("expirace hovoru provede právě jeden přechod bez nového pokusu", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-2");
    const dueAt = NOW - CALL_READY_GRACE_MS[original.source] - 1;
    const prepared = {
      ...initial,
      contacts: initial.contacts.map((item) => item.id === original.id ? { ...item, status: "call_later" as const, nextActivity: { id: "expired", type: "call" as const, dueAt } } : item),
    };
    const attempts = getAttemptCount(contact(prepared, original.id));
    const expired = applyTimeRules(prepared, NOW);
    const secondPass = applyTimeRules(expired, NOW + 10_000);

    expect(contact(expired, original.id).status).toBe("to_call");
    expect(getAttemptCount(contact(expired, original.id))).toBe(attempts);
    expect(secondPass).toBe(expired);
  });

  it("obnoví platný uložený scénář a bezpečně nahradí poškozený", () => {
    const initial = createDemoState(NOW);
    const valid = restoreDemoState(JSON.stringify(initial), NOW);
    const broken = restoreDemoState('{"schemaVersion":2,"contacts":[', NOW);

    expect(valid.recovered).toBe(false);
    expect(valid.state.contacts).toHaveLength(initial.contacts.length);
    expect(broken.recovered).toBe(true);
    expect(broken.state.contacts.length).toBeGreaterThan(0);
  });
});
