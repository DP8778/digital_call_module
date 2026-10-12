import { COLUMN_LABEL_CS, isMoveAllowed } from "./allowedMoves";
import { DEMO_SCHEMA_VERSION, DEMO_STORAGE_KEY } from "./demoConstants";
import { createDemoState } from "./mockContacts";
import type {
  Contact,
  ContactSource,
  DemoState,
  OutcomeInput,
  ScheduleInput,
  TimelineEntry,
} from "./types";

export { DEMO_SCHEMA_VERSION, DEMO_STORAGE_KEY };

export const FOLLOW_UP_RULES_MS: Record<ContactSource, readonly [number, number]> = {
  tipar: [60_000, 30_000],
  fb: [60 * 60_000, 30 * 60_000],
  callcentrum: [60 * 60_000, 30 * 60_000],
  inzerce: [24 * 60 * 60_000, 12 * 60 * 60_000],
};

export const CALL_READY_GRACE_MS: Record<ContactSource, number> = {
  tipar: 20_000,
  fb: 60 * 60_000,
  callcentrum: 60 * 60_000,
  inzerce: 60 * 60_000,
};

const OUTCOME_LABEL = {
  no_answer: "Nedovoláno",
  meeting_booked: "Domluvena schůzka",
  call_later: "Ozvat se později",
  disqualified: "Kontakt vyřazen",
} as const;

function eventId(contactId: string, at: number, suffix: string): string {
  return `${contactId}-${at}-${suffix}`;
}

function replaceContact(state: DemoState, nextContact: Contact, now: number): DemoState {
  return {
    ...state,
    updatedAt: now,
    contacts: state.contacts.map((contact) =>
      contact.id === nextContact.id ? nextContact : contact,
    ),
  };
}

export function getAttemptCount(contact: Contact): number {
  return contact.history.filter((entry) => entry.type === "call_attempt").length;
}

export function getRecommendedFollowUpAt(contact: Contact, now: number): number {
  const completedAttempts = getAttemptCount(contact);
  const [first, later] = FOLLOW_UP_RULES_MS[contact.source];
  return now + (completedAttempts === 0 ? first : later);
}

export function moveContact(
  state: DemoState,
  contactId: string,
  target: Contact["status"],
  now: number,
): DemoState {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact || !isMoveAllowed(contact.status, target)) return state;

  const event: TimelineEntry = {
    id: eventId(contact.id, now, `status-${target}`),
    at: now,
    type: "status_change",
    label: `Stav změněn: ${COLUMN_LABEL_CS[target]}`,
  };
  const clearsActivity = target === "backlog" || target === "listed" || target === "disqualified";
  return replaceContact(
    state,
    {
      ...contact,
      status: target,
      statusUpdatedAt: now,
      nextActivity: clearsActivity ? null : contact.nextActivity,
      history: [event, ...contact.history],
    },
    now,
  );
}

export function scheduleActivity(
  state: DemoState,
  contactId: string,
  input: ScheduleInput,
  now: number,
): DemoState {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact || input.dueAt <= now || !Number.isFinite(input.dueAt)) return state;
  const typeLabel = input.activityType === "call" ? "hovor" : "schůzka";
  const event: TimelineEntry = {
    id: eventId(contact.id, now, "schedule"),
    at: now,
    type: "activity_scheduled",
    label: `Naplánována další aktivita: ${typeLabel}`,
  };
  return replaceContact(
    state,
    {
      ...contact,
      nextActivity: {
        id: eventId(contact.id, input.dueAt, input.activityType),
        type: input.activityType,
        dueAt: input.dueAt,
      },
      history: [event, ...contact.history],
    },
    now,
  );
}

export function recordCallOutcome(
  state: DemoState,
  contactId: string,
  input: OutcomeInput,
  now: number,
): DemoState {
  const contact = state.contacts.find((item) => item.id === contactId);
  if (!contact || contact.status !== "to_call") return state;

  const target = input.outcome === "meeting_booked"
    ? "meeting"
    : input.outcome === "disqualified"
      ? "disqualified"
      : "call_later";
  if (!isMoveAllowed(contact.status, target)) return state;

  const needsDate = input.outcome === "meeting_booked" || input.outcome === "call_later";
  if (needsDate && (!input.scheduledAt || input.scheduledAt <= now)) return state;

  const scheduledAt = input.outcome === "no_answer"
    ? input.scheduledAt ?? getRecommendedFollowUpAt(contact, now)
    : input.scheduledAt;
  const activityType = input.outcome === "meeting_booked" ? "meeting" : "call";
  const attempt: TimelineEntry = {
    id: eventId(contact.id, now, "attempt"),
    at: now,
    type: "call_attempt",
    label: OUTCOME_LABEL[input.outcome],
    note: input.note.trim() || undefined,
    outcome: input.outcome,
  };
  const statusEvent: TimelineEntry = {
    id: eventId(contact.id, now, `status-${target}`),
    at: now,
    type: "status_change",
    label: `Stav změněn: ${COLUMN_LABEL_CS[target]}`,
  };

  return replaceContact(
    state,
    {
      ...contact,
      status: target,
      statusUpdatedAt: now,
      nextActivity:
        input.outcome === "disqualified" || !scheduledAt
          ? null
          : {
              id: eventId(contact.id, scheduledAt, activityType),
              type: activityType,
              dueAt: scheduledAt,
            },
      history: [statusEvent, attempt, ...contact.history],
    },
    now,
  );
}

/**
 * Po uplynutí termínu a zdrojové tolerance zpřístupní hovor právě jednou.
 * Nevytváří pokus a nemění termín, takže kontakt zůstane viditelně po termínu.
 */
export function applyTimeRules(state: DemoState, now: number): DemoState {
  let changed = false;
  const contacts = state.contacts.map((contact) => {
    const activity = contact.nextActivity;
    if (
      contact.status !== "call_later" ||
      !activity ||
      activity.type !== "call" ||
      now < activity.dueAt + CALL_READY_GRACE_MS[contact.source]
    ) {
      return contact;
    }
    changed = true;
    return {
      ...contact,
      status: "to_call" as const,
      statusUpdatedAt: now,
      history: [
        {
          id: eventId(contact.id, now, "ready"),
          at: now,
          type: "status_change" as const,
          label: "Termín uplynul – kontakt je připraven k provolání",
        },
        ...contact.history,
      ],
    };
  });
  return changed ? { ...state, contacts, updatedAt: now } : state;
}

function isValidContact(value: unknown): value is Contact {
  if (!value || typeof value !== "object") return false;
  const contact = value as Partial<Contact>;
  return (
    typeof contact.id === "string" &&
    typeof contact.name === "string" &&
    typeof contact.status === "string" &&
    Array.isArray(contact.history)
  );
}

export function restoreDemoState(
  serialized: string | null,
  now: number,
): { state: DemoState; recovered: boolean } {
  if (!serialized) return { state: createDemoState(now), recovered: false };
  try {
    const parsed = JSON.parse(serialized) as Partial<DemoState>;
    if (
      parsed.schemaVersion !== DEMO_SCHEMA_VERSION ||
      !Array.isArray(parsed.contacts) ||
      parsed.contacts.length === 0 ||
      !parsed.contacts.every(isValidContact) ||
      new Set(parsed.contacts.map((contact) => contact.id)).size !== parsed.contacts.length
    ) {
      return { state: createDemoState(now), recovered: true };
    }
    return { state: applyTimeRules(parsed as DemoState, now), recovered: false };
  } catch {
    return { state: createDemoState(now), recovered: true };
  }
}
