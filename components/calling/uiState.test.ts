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
      newFilters: { query: "", city: "all", type: "all", subtype: "all", source: "all", sort: "newest" },
    });
  });

  it("obnoví nový pohled a jeho filtry nezávisle na frontě", () => {
    const restored = restoreCallingUiState(JSON.stringify({
      schemaVersion: 1, view: "new",
      filters: { query: "Eva", source: "inzerce", status: "meeting" },
      newFilters: { query: "Praha", city: "Praha 7", type: "pronajem", subtype: "Byt 2+kk", source: "fb", sort: "oldest" },
    }));
    expect(restored.view).toBe("new");
    expect(restored.filters.query).toBe("Eva");
    expect(restored.newFilters).toMatchObject({ city: "Praha 7", sort: "oldest" });
  });

  it("neplatné nové filtry nahradí bezpečně bez ztráty původních filtrů", () => {
    const restored = restoreCallingUiState(JSON.stringify({
      schemaVersion: 1, view: "new",
      filters: { query: "Eva", source: "all", status: "all" },
      newFilters: { query: "", city: "all", type: "neznámý", subtype: "all", source: "all", sort: "oldest" },
    }));
    expect(restored.filters.query).toBe("Eva");
    expect(restored.newFilters.type).toBe("all");
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
