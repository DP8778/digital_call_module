import { describe, expect, it } from "vitest";
import { readCallingUiState, restoreCallingUiState } from "./uiState";

describe("obnova UI výběru", () => {
  it("obnoví platný pohled a pracovní výběr", () => {
    const restored = restoreCallingUiState(JSON.stringify({
      schemaVersion: 1,
      view: "process",
      filters: { query: "Praha", source: "fb", status: "to_call" },
    }));

    expect(restored).toMatchObject({
      view: "process",
      filters: { query: "Praha", source: "fb", status: "to_call" },
    });
  });

  it("neplatnou enum hodnotu bezpečně nahradí výchozím stavem", () => {
    const restored = restoreCallingUiState(JSON.stringify({
      schemaVersion: 1,
      view: "process",
      filters: { query: "Praha", source: "neznámý", status: "to_call" },
    }));

    expect(restored).toMatchObject({
      view: "today",
      filters: { query: "", source: "all", status: "all" },
    });
  });

  it("blokované sessionStorage vrátí bezpečný výchozí stav", () => {
    const restored = readCallingUiState({
      getItem() {
        throw new DOMException("blocked");
      },
    });

    expect(restored.view).toBe("today");
    expect(restored.filters).toEqual({ query: "", source: "all", status: "all" });
  });
});
