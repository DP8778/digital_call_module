import { describe, expect, it } from "vitest";
import {
  addPragueCalendarDays,
  formatPragueDateTime,
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
});
