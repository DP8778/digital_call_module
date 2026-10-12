import { ACTIVITY_LABEL } from "./labels";
import { pragueDayKey, relativeDayLabel } from "./time";
import type { Contact } from "./types";

export type QueueGroupId = "missed" | "today" | "later" | "unscheduled";

export function getQueueGroup(contact: Contact, now: number): QueueGroupId {
  if (!contact.nextActivity) {
    return contact.status === "to_call" ? "today" : "unscheduled";
  }
  if (contact.nextActivity.dueAt < now) return "missed";
  if (pragueDayKey(contact.nextActivity.dueAt) === pragueDayKey(now)) return "today";
  return "later";
}

export function needsAttentionNow(contact: Contact, now: number): boolean {
  return getQueueGroup(contact, now) === "missed" ||
    (contact.status === "to_call" && !contact.nextActivity);
}

export function getAttentionReason(contact: Contact, now: number): string {
  if (!contact.nextActivity) {
    if (contact.status === "to_call") return "Kontakt je připravený k hovoru nyní.";
    if (contact.status === "listed") return "Kontakt je úspěšně uzavřený.";
    if (contact.status === "disqualified") return "Kontakt byl vyřazený z dalšího zpracování.";
    return "Kontakt nemá určený další krok.";
  }
  const activity = ACTIVITY_LABEL[contact.nextActivity.type].toLocaleLowerCase("cs");
  if (contact.nextActivity.dueAt < now) {
    return `${ACTIVITY_LABEL[contact.nextActivity.type]} je po termínu (${relativeDayLabel(contact.nextActivity.dueAt, now)}).`;
  }
  return `Další ${activity} je ${relativeDayLabel(contact.nextActivity.dueAt, now).toLocaleLowerCase("cs")}.`;
}

export function formatCzechCount(
  count: number,
  forms: readonly [string, string, string],
): string {
  const absolute = Math.abs(count);
  const form = absolute === 1
    ? forms[0]
    : absolute >= 2 && absolute <= 4
      ? forms[1]
      : forms[2];
  return `${count} ${form}`;
}

export function formatAttemptCount(count: number): string {
  return formatCzechCount(count, ["pokus", "pokusy", "pokusů"]);
}
