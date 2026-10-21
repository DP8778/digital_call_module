import { describe, expect, it } from "vitest";
import { createDemoState } from "./mockContacts";
import {
  applyBoardOperation,
  applyTimeRules,
  CALL_READY_GRACE_MS,
  createContactMoveDraft,
  getAttemptCount,
  getRecommendedFollowUpAt,
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
  it("vytvoří návrh jen pro povolený jiný cílový stav", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-4");

    expect(createContactMoveDraft(original, "call_later")).toMatchObject({ source: "to_call", target: "call_later" });
    expect(createContactMoveDraft(original, "to_call")).toBeNull();
    expect(createContactMoveDraft(original, "listed")).toBeNull();
    expect(createContactMoveDraft(original, null)).toBeNull();
  });

  it("samotný návrh ani jeho zrušení nemění data a počty", () => {
    const initial = createDemoState(NOW);
    const serialized = JSON.stringify(initial);
    const draft = createContactMoveDraft(contact(initial, "demo-4"), "call_later");

    expect(draft).not.toBeNull();
    expect(JSON.stringify(initial)).toBe(serialized);
    expect(initial.contacts).toHaveLength(JSON.parse(serialized).contacts.length);
  });

  it("atomicky potvrdí stav a povinnou aktivitu bez vytvoření pokusu", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-4");
    const attempts = getAttemptCount(original);
    const draft = createContactMoveDraft(original, "call_later")!;
    const dueAt = NOW + 2 * 60 * 60_000;
    const result = applyBoardOperation(initial, { kind: "confirm_move", draft, activity: { activityType: "call", dueAt } }, NOW + 1_000);

    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.contact).toMatchObject({ status: "call_later", nextActivity: { type: "call", dueAt } });
    expect(getAttemptCount(result.contact)).toBe(attempts);
    expect(result.state.contacts).toHaveLength(initial.contacts.length);
    expect(result.contact.history.filter((entry) => entry.at === NOW + 1_000).map((entry) => entry.type)).toEqual(["status_change", "activity_cancelled", "activity_scheduled"]);
  });

  it("odmítne neplatný nebo mezitím prošlý termín beze změny stavu i aktivity", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-4");
    const draft = createContactMoveDraft(original, "meeting")!;
    const dueAt = NOW + 1_000;
    const result = applyBoardOperation(initial, { kind: "confirm_move", draft, activity: { activityType: "meeting", dueAt } }, dueAt);

    expect(result).toMatchObject({ accepted: false, reason: "expired", state: initial });
    expect(contact(initial, original.id)).toBe(original);
  });

  it("odmítne zastaralý návrh po změně aktivity", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-4");
    const draft = createContactMoveDraft(original, "meeting")!;
    const changed = {
      ...initial,
      contacts: initial.contacts.map((item) => item.id === original.id ? { ...item, nextActivity: { id: "new", type: "call" as const, dueAt: NOW + 60_000 } } : item),
    };
    const result = applyBoardOperation(changed, { kind: "confirm_move", draft, activity: { activityType: "meeting", dueAt: NOW + 120_000 } }, NOW + 1_000);

    expect(result).toMatchObject({ accepted: false, reason: "stale", state: changed });
    expect(contact(changed, original.id).status).toBe("to_call");
  });

  it("odmítne návrh zastaralý automatickým časovým přechodem", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-11");
    const draft = createContactMoveDraft(original, "meeting")!;
    const afterTimeRule = applyTimeRules(initial, NOW);
    const result = applyBoardOperation(afterTimeRule, { kind: "confirm_move", draft, activity: { activityType: "meeting", dueAt: NOW + 120_000 } }, NOW);

    expect(contact(afterTimeRule, original.id).status).toBe("to_call");
    expect(result).toMatchObject({ accepted: false, reason: "stale", state: afterTimeRule });
  });

  it("opakované potvrzení téhož návrhu provede právě jeden přesun", () => {
    const initial = createDemoState(NOW);
    const draft = createContactMoveDraft(contact(initial, "demo-7"), "to_call")!;
    const first = applyBoardOperation(initial, { kind: "confirm_move", draft }, NOW + 1_000);

    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    const duplicate = applyBoardOperation(first.state, { kind: "confirm_move", draft }, NOW + 2_000);
    expect(duplicate).toMatchObject({ accepted: false, reason: "stale", state: first.state });
    expect(first.contact.history.filter((entry) => entry.type === "status_change" && entry.label.includes("K provolání"))).toHaveLength(1);
  });

  it("při přesunu k provolání zachová skutečnou aktivitu", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-6");
    const draft = createContactMoveDraft(original, "to_call")!;
    const result = applyBoardOperation(initial, { kind: "confirm_move", draft }, NOW + 1_000);

    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.contact.nextActivity).toEqual(original.nextActivity);
    expect(result.contact.history.some((entry) => entry.at === NOW + 1_000 && entry.type === "activity_cancelled")).toBe(false);
  });

  it("při uzavření atomicky zruší aktivitu a zapíše přesný termín", () => {
    const initial = createDemoState(NOW);
    const original = contact(initial, "demo-3");
    const draft = createContactMoveDraft(original, "listed")!;
    const result = applyBoardOperation(initial, { kind: "confirm_move", draft }, NOW + 1_000);

    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.contact).toMatchObject({ status: "listed", nextActivity: null });
    const cancelled = result.contact.history.find((entry) => entry.at === NOW + 1_000 && entry.type === "activity_cancelled");
    expect(cancelled?.note).toContain("Schůzka");
    expect(cancelled?.note).toContain("2026");
  });

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

  it("v koncovém stavu odmítne naplánovat další aktivitu", () => {
    const initial = createDemoState(NOW);
    const next = scheduleActivity(initial, "demo-9", { activityType: "call", dueAt: NOW + 60_000 }, NOW);

    expect(next).toBe(initial);
    expect(contact(next, "demo-9").status).toBe("listed");
    expect(contact(next, "demo-9").nextActivity).toBeNull();
  });

  it("při přesunu ruší aktivitu dohledatelnou událostí", () => {
    const initial = createDemoState(NOW);
    const moved = moveContact(initial, "demo-1", "backlog", NOW + 1_000);
    const updated = contact(moved, "demo-1");

    expect(updated.nextActivity).toBeNull();
    expect(updated.history.find((entry) => entry.type === "activity_cancelled")?.note).toContain("Hovor");
  });

  it("odmítne i u nedovolání explicitní termín v minulosti", () => {
    const initial = createDemoState(NOW);
    const next = recordCallOutcome(initial, "demo-4", {
      outcome: "no_answer",
      note: "",
      scheduledAt: NOW - 1,
    }, NOW);

    expect(next).toBe(initial);
  });

  it("potvrdí platný termín podle skutečně přijatého stavu bez změny procesu", () => {
    const initial = createDemoState(NOW);
    const dueAt = NOW + 2 * 60 * 60_000;
    const result = applyBoardOperation(initial, { kind: "schedule", contactId: "demo-7", input: { activityType: "meeting", dueAt } }, NOW);

    expect(result.accepted).toBe(true);
    if (!result.accepted) return;
    expect(result.contact.status).toBe("backlog");
    expect(result.contact.nextActivity).toMatchObject({ type: "meeting", dueAt });
    expect(result.contact.history[0]).toMatchObject({ type: "activity_scheduled", at: NOW });
    expect(getAttemptCount(result.contact)).toBe(getAttemptCount(contact(initial, "demo-7")));
  });

  it("odmítne termín, který uplynul mezi otevřením a potvrzením, bez falešného úspěchu", () => {
    const initial = createDemoState(NOW);
    const dueAt = NOW + 1_000;
    const result = applyBoardOperation(initial, { kind: "schedule", contactId: "demo-7", input: { activityType: "call", dueAt } }, NOW + 1_001);

    expect(result).toMatchObject({ accepted: false, reason: "expired", state: initial });
    expect(contact(initial, "demo-7").nextActivity).toBeNull();
  });

  it("vypršené krátké doporučení nepřidá pokus ani nepotvrdí výsledek", () => {
    const demo = createDemoState(NOW);
    const initial = { ...demo, contacts: demo.contacts.map((item) => item.id === "demo-11" ? { ...item, status: "to_call" as const } : item) };
    const original = contact(initial, "demo-11");
    const recommendedAt = getRecommendedFollowUpAt(original, NOW);
    const result = applyBoardOperation(initial, { kind: "outcome", contactId: original.id, input: { outcome: "no_answer", note: "Rozepsaná poznámka", scheduledAt: recommendedAt } }, recommendedAt);

    expect(recommendedAt).toBe(NOW + 30_000);
    expect(result).toMatchObject({ accepted: false, reason: "expired", state: initial });
    expect(contact(initial, original.id).history).toBe(original.history);
  });

  it("po přijatém výsledku zapíše jediný pokus a opakované potvrzení odmítne", () => {
    const initial = createDemoState(NOW);
    const input = { outcome: "no_answer" as const, note: "Bez odezvy", scheduledAt: NOW + 60_000 };
    const first = applyBoardOperation(initial, { kind: "outcome", contactId: "demo-4", input }, NOW);

    expect(first.accepted).toBe(true);
    if (!first.accepted) return;
    expect(getAttemptCount(first.contact)).toBe(getAttemptCount(contact(initial, "demo-4")) + 1);
    expect(first.contact.history.filter((entry) => entry.type === "call_attempt" && entry.at === NOW)).toHaveLength(1);
    expect(first.contact.nextActivity?.dueAt).toBe(input.scheduledAt);

    const duplicate = applyBoardOperation(first.state, { kind: "outcome", contactId: "demo-4", input }, NOW + 1_000);
    expect(duplicate).toMatchObject({ accepted: false, reason: "stale", state: first.state });
    expect(getAttemptCount(contact(first.state, "demo-4"))).toBe(getAttemptCount(first.contact));
  });

  it("zachová přesné krátké intervaly tipaře 60 a 30 sekund", () => {
    const initial = createDemoState(NOW);
    const first = contact(initial, "demo-4");
    const later = contact(initial, "demo-11");

    expect(getRecommendedFollowUpAt(first, NOW)).toBe(NOW + 60_000);
    expect(getRecommendedFollowUpAt(later, NOW)).toBe(NOW + 30_000);
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
