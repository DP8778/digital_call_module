import { ACTIVITY_LABEL } from "./labels";
import { pragueDayKey, relativeDayLabel } from "./time";
import type { QueueFilters } from "./uiState";
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

export function getActiveQueueContacts(contacts: Contact[]): Contact[] {
  return contacts.filter((contact) => contact.status !== "listed" && contact.status !== "disqualified");
}

export function filterQueueContacts(contacts: Contact[], filters: QueueFilters): Contact[] {
  const normalized = filters.query.trim().toLocaleLowerCase("cs");
  return getActiveQueueContacts(contacts)
    .filter((contact) => filters.source === "all" || contact.source === filters.source)
    .filter((contact) => filters.status === "all" || contact.status === filters.status)
    .filter((contact) => {
      if (!normalized) return true;
      return [contact.name, contact.city, contact.subtype, contact.phone, contact.email]
        .join(" ")
        .toLocaleLowerCase("cs")
        .includes(normalized);
    });
}

export function getQueueSummary(allContacts: Contact[], selectedContacts: Contact[], now: number) {
  const activeContacts = getActiveQueueContacts(allContacts);
  return {
    attentionTotal: activeContacts.filter((contact) => needsAttentionNow(contact, now)).length,
    todayRemainingTotal: activeContacts.filter(
      (contact) => getQueueGroup(contact, now) === "today" && !needsAttentionNow(contact, now),
    ).length,
    selectionAttention: selectedContacts.filter((contact) => needsAttentionNow(contact, now)).length,
    selectionResults: selectedContacts.length,
  };
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
