import { describe, expect, it } from "vitest";
import { persistDemoState, readDemoState, resetDemoState } from "./callingStorage";
import { createDemoState } from "./mockContacts";
import { applyBoardOperation, createContactMoveDraft, moveContact } from "./stateLogic";
import { parsePragueDateTime } from "./time";

const NOW = parsePragueDateTime("2026-10-12T12:00")!;

describe("odolnost úložiště dema", () => {
  it("rozliší chybějící, neplatný a platný uložený obsah", () => {
    const missing = readDemoState({ getItem: () => null }, NOW);
    const invalid = readDemoState({ getItem: () => '{"schemaVersion":2,"contacts":[' }, NOW);
    const valid = readDemoState({ getItem: () => JSON.stringify(createDemoState(NOW)) }, NOW);

    expect(missing).toMatchObject({ readStatus: "missing", persistence: "enabled", notice: null });
    expect(invalid).toMatchObject({ readStatus: "invalid", persistence: "enabled", notice: "recovered" });
    expect(valid).toMatchObject({ readStatus: "valid", persistence: "enabled", notice: null });
  });

  it("po chybě čtení načte paměťový dataset a zakáže automatický zápis", () => {
    const result = readDemoState({
      getItem() {
        throw new DOMException("blocked");
      },
    }, NOW);

    expect(result).toMatchObject({
      readStatus: "unavailable",
      persistence: "read-unavailable",
      notice: "read-unavailable",
    });
    expect(result.state.contacts.length).toBeGreaterThan(0);
  });

  it("po chybě čtení automaticky nepřepíše předexistující validní stav", () => {
    const original = JSON.stringify(createDemoState(NOW - 60_000));
    let stored = original;
    let writes = 0;
    const storage = {
      getItem() {
        throw new DOMException("temporary read failure");
      },
      setItem(_key: string, value: string) {
        writes += 1;
        stored = value;
      },
    };
    const restored = readDemoState(storage, NOW);
    const changedInMemory = moveContact(restored.state, "demo-7", "to_call", NOW + 1_000);
    const persisted = persistDemoState(storage, changedInMemory, restored.persistence);

    expect(persisted).toMatchObject({ status: "skipped", persistence: "read-unavailable" });
    expect(writes).toBe(0);
    expect(stored).toBe(original);
    expect(changedInMemory.contacts.find((contact) => contact.id === "demo-7")?.status).toBe("to_call");
  });

  it("po platném čtení a chybě zápisu pokračuje se změnou v paměti", () => {
    let writes = 0;
    const storage = {
      getItem: () => JSON.stringify(createDemoState(NOW)),
      setItem() {
        writes += 1;
        throw new DOMException("blocked");
      },
    };
    const restored = readDemoState(storage, NOW);
    const changedInMemory = moveContact(restored.state, "demo-7", "to_call", NOW + 1_000);
    const persisted = persistDemoState(storage, changedInMemory, restored.persistence);
    const retry = persistDemoState(storage, changedInMemory, persisted.persistence);

    expect(changedInMemory.contacts.find((contact) => contact.id === "demo-7")?.status).toBe("to_call");
    expect(persisted).toMatchObject({ status: "failed", persistence: "write-unavailable" });
    expect(retry.status).toBe("skipped");
    expect(writes).toBe(1);
  });

  it("po obnovení stránky načte atomicky potvrzený stav i aktivitu", () => {
    const initial = createDemoState(NOW);
    const original = initial.contacts.find((item) => item.id === "demo-4")!;
    const draft = createContactMoveDraft(original, "meeting")!;
    const dueAt = NOW + 2 * 60 * 60_000;
    const moved = applyBoardOperation(initial, { kind: "confirm_move", draft, activity: { activityType: "meeting", dueAt } }, NOW + 1_000);
    expect(moved.accepted).toBe(true);
    if (!moved.accepted) return;

    let stored: string | null = null;
    const storage = {
      getItem: () => stored,
      setItem: (_key: string, value: string) => { stored = value; },
    };
    expect(persistDemoState(storage, moved.state, "enabled").status).toBe("saved");
    const restored = readDemoState(storage, NOW + 2_000);
    expect(restored.state.contacts.find((item) => item.id === original.id)).toMatchObject({ status: "meeting", nextActivity: { type: "meeting", dueAt } });
  });

  it("vědomý reset může po chybě čtení uložený stav nahradit", () => {
    let writes = 0;
    let stored = JSON.stringify(createDemoState(NOW - 60_000));
    const storage = {
      getItem() {
        throw new DOMException("temporary read failure");
      },
      setItem(_key: string, value: string) {
        writes += 1;
        stored = value;
      },
    };
    const restored = readDemoState(storage, NOW);
    const reset = resetDemoState(storage, NOW);

    expect(restored.persistence).toBe("read-unavailable");
    expect(reset).toMatchObject({ persistence: "enabled", notice: null });
    expect(writes).toBe(1);
    expect(JSON.parse(stored).updatedAt).toBe(NOW);
  });

  it("výjimka setItem neznemožní reset paměťového stavu", () => {
    const result = resetDemoState({
      setItem() {
        throw new DOMException("blocked");
      },
    }, NOW);

    expect(result).toMatchObject({ persistence: "write-unavailable", notice: "write-unavailable" });
    expect(result.state.contacts.length).toBeGreaterThan(0);
    expect(result.state.updatedAt).toBe(NOW);
  });
});
