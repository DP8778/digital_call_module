import { ACTIVITY_LABEL } from "./labels";
import { getQueueGroup } from "./queueLogic";
import type { Contact } from "./types";

export type QueuePresentationKind = "overdue" | "ready" | "today" | "later" | "missing" | "closed" | "new";

export type QueuePresentation = {
  kind: QueuePresentationKind;
  badge: string | null;
  activity: string;
  dueAt: number | null;
  reason: string;
};

export function getQueuePresentation(contact: Contact, now: number): QueuePresentation {
  if (contact.status === "listed" || contact.status === "disqualified") {
    return { kind: "closed", badge: null, activity: "Bez další aktivity", dueAt: null, reason: "Proces je uzavřený." };
  }

  if (contact.status === "backlog" && !contact.nextActivity) {
    return { kind: "new", badge: null, activity: "Dosud nezahájeno", dueAt: null, reason: "Kontakt zatím není ve zpracování." };
  }

  const group = getQueueGroup(contact, now);
  if (group === "missed" && contact.nextActivity) {
    return {
      kind: "overdue",
      badge: "Po termínu",
      activity: ACTIVITY_LABEL[contact.nextActivity.type],
      dueAt: contact.nextActivity.dueAt,
      reason: `${ACTIVITY_LABEL[contact.nextActivity.type]} je po termínu.`,
    };
  }
  if (contact.status === "to_call" && !contact.nextActivity) {
    return { kind: "ready", badge: "Připraveno nyní", activity: "Hovor", dueAt: null, reason: "Kontakt je připravený k hovoru nyní." };
  }
  if (contact.nextActivity) {
    return {
      kind: group === "today" ? "today" : "later",
      badge: group === "today" ? "Dnes" : null,
      activity: ACTIVITY_LABEL[contact.nextActivity.type],
      dueAt: contact.nextActivity.dueAt,
      reason: group === "today" ? "Další aktivita je naplánovaná na dnešek." : "Další aktivita je naplánovaná na později.",
    };
  }
  return { kind: "missing", badge: "Chybí další krok", activity: "Bez určené aktivity", dueAt: null, reason: "Kontakt nemá určený další krok." };
}
