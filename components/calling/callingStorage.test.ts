import { describe, expect, it } from "vitest";
import { readDemoState, resetDemoState } from "./callingStorage";
import { parsePragueDateTime } from "./time";

const NOW = parsePragueDateTime("2026-10-12T12:00")!;

describe("odolnost úložiště dema", () => {
  it("odliší neplatná uložená data od nedostupného úložiště", () => {
    const result = readDemoState({
      getItem() {
        return '{"schemaVersion":2,"contacts":[';
      },
    }, NOW);

    expect(result.notice).toBe("recovered");
    expect(result.state.contacts.length).toBeGreaterThan(0);
  });

  it("výjimka getItem neznemožní načtení syntetického datasetu", () => {
    const result = readDemoState({
      getItem() {
        throw new DOMException("blocked");
      },
    }, NOW);

    expect(result.notice).toBe("unavailable");
    expect(result.state.contacts.length).toBeGreaterThan(0);
    expect(new Set(result.state.contacts.map((contact) => contact.id)).size).toBe(result.state.contacts.length);
  });

  it("výjimka setItem neznemožní reset paměťového stavu", () => {
    const result = resetDemoState({
      setItem() {
        throw new DOMException("blocked");
      },
    }, NOW);

    expect(result.notice).toBe("unavailable");
    expect(result.state.contacts.length).toBeGreaterThan(0);
    expect(result.state.updatedAt).toBe(NOW);
  });
});
