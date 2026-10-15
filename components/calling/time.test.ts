import { describe, expect, it } from "vitest";
import {
  addPragueCalendarDays,
  formatContextualPragueDateTime,
  formatPragueDateTime,
  formatPragueDateTimePrecise,
  parsePragueDateTime,
  pragueDayStart,
  toPragueDateTimeInput,
} from "./time";

describe("časové výpočty Europe/Prague", () => {
  it("provede round-trip lokálního termínu", () => {
    const timestamp = parsePragueDateTime("2026-10-12T14:30");
    expect(timestamp).not.toBeNull();
    expect(toPragueDateTimeInput(timestamp!)).toBe("2026-10-12T14:30");
    expect(formatPragueDateTime(timestamp!)).toContain("14:30");
  });

  it("zobrazí sekundy u přesného krátkého termínu", () => {
    const timestamp = parsePragueDateTime("2026-10-12T14:30")! + 30_000;
    expect(formatPragueDateTimePrecise(timestamp)).toContain("14:30:30");
  });

  it("zobrazí starší termín jednou a u přesného dne zachová sekundy", () => {
    const now = parsePragueDateTime("2026-10-13T12:00")!;
    const older = parsePragueDateTime("2026-10-11T09:00")!;
    const preciseToday = parsePragueDateTime("2026-10-13T14:30")! + 30_000;

    expect(formatContextualPragueDateTime(older, now)).toBe("11. 10. 2026 · 09:00");
    expect(formatContextualPragueDateTime(preciseToday, now)).toBe("Dnes · 14:30:30");
  });

  it("odmítne neexistující čas při jarním přechodu", () => {
    expect(parsePragueDateTime("2026-03-29T02:30")).toBeNull();
    expect(parsePragueDateTime("2026-03-29T03:30")).not.toBeNull();
  });

  it("zohlední 23hodinový a 25hodinový den", () => {
    const spring = parsePragueDateTime("2026-03-29T12:00")!;
    const autumn = parsePragueDateTime("2026-10-25T12:00")!;
    expect(addPragueCalendarDays(spring, 1, 0) - pragueDayStart(spring)).toBe(23 * 60 * 60_000);
    expect(addPragueCalendarDays(autumn, 1, 0) - pragueDayStart(autumn)).toBe(25 * 60 * 60_000);
  });

  it("oddělí sousední pražské dny přesně na půlnoci", () => {
    const before = parsePragueDateTime("2026-10-12T23:59")!;
    const midnight = parsePragueDateTime("2026-10-13T00:00")!;

    expect(midnight - before).toBe(60_000);
    expect(pragueDayStart(midnight)).toBe(midnight);
    expect(pragueDayStart(before)).toBe(parsePragueDateTime("2026-10-12T00:00"));
  });
});
