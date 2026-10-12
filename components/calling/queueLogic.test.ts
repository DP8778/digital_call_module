import { describe, expect, it } from "vitest";
import { createDemoState } from "./mockContacts";
import { formatAttemptCount, formatCzechCount, getQueueGroup } from "./queueLogic";
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
});
