import { useEffect, useState } from "react";
import { isMoveAllowed } from "./allowedMoves";
import type { ColumnId, Contact } from "./types";
import { MOCK_CONTACTS_ALL } from "./mockContacts";

export type { ColumnId } from "./types";
export { isMoveAllowed } from "./allowedMoves";

type ColumnsState = Record<ColumnId, Contact[]>;

type DragLocation = {
  columnId: ColumnId;
};

/** Ostatní zdroje než Tipař ve „Volat později“: po scheduledAt červená přesně tento čas, pak přesun do to_call. */
const CALL_LATER_OTHER_GRACE_MS = 60 * 60 * 1000;

/** Tipař ve „Volat později“: po scheduledAt zůstane karta ještě tento čas, pak auto-přesun do k provolání. */
export const TIPAR_CALL_LATER_GRACE_MS = 20_000;

const TIPAR_TO_CALL_FIRST_MS = 60_000;
const TIPAR_TO_CALL_SECOND_MS = 30_000;

function getToCallLockDuration(source: Contact["source"], attemptCount: number): number {
  if (source === "tipar") {
    if (attemptCount <= 1) return TIPAR_TO_CALL_FIRST_MS;
    return TIPAR_TO_CALL_SECOND_MS;
  }

  const isShorterSource = source === "fb" || source === "callcentrum";

  if (isShorterSource) {
    if (attemptCount <= 1) return 1000 * 60 * 60;
    return 1000 * 60 * 30;
  }

  if (attemptCount <= 1) return 1000 * 60 * 60 * 24;
  return 1000 * 60 * 60 * 12;
}

/** Vypršení zámku v to_call: attemptCount < 3 → nový zámek stejné délky podle zdroje a pokusu; ≥ 3 → backlog. */
function applyExpiredToCallHandling(columns: ColumnsState, now: number): ColumnsState {
  const expiredToCall = columns.to_call.filter(
    (c) => typeof c.lockedUntil === "number" && c.lockedUntil < now,
  );
  if (expiredToCall.length === 0) {
    return columns;
  }

  const expiredIds = new Set(expiredToCall.map((c) => c.id));

  const renewLock = expiredToCall.filter((c) => (c.attemptCount ?? 0) < 3);
  const toBacklogFromToCall = expiredToCall.filter((c) => (c.attemptCount ?? 0) >= 3);

  const renewed: Contact[] = renewLock.map((c) => {
    const ac = Math.max(1, c.attemptCount ?? 0);
    return {
      ...c,
      statusUpdatedAt: now,
      lockedUntil: now + getToCallLockDuration(c.source, ac),
    };
  });

  const cleanedBacklog: Contact[] = toBacklogFromToCall.map((c) => {
    const cleaned: Contact = { ...c };
    delete cleaned.lockedUntil;
    delete cleaned.statusUpdatedAt;
    return cleaned;
  });

  return {
    ...columns,
    to_call: [...columns.to_call.filter((c) => !expiredIds.has(c.id)), ...renewed],
    backlog: [...columns.backlog, ...cleanedBacklog],
  };
}

/** Po uplynutí scheduledAt + grace u tipaře v call_later → k provolání, attemptCount +1, zámek podle nového pokusu. */
function applyTiparCallLaterGraceElapsed(
  columns: ColumnsState,
  contactId: string,
  now: number,
): ColumnsState {
  const contact = columns.call_later.find((c) => c.id === contactId);
  if (!contact || contact.source !== "tipar" || typeof contact.scheduledAt !== "number") {
    return columns;
  }

  const nextCallLater = columns.call_later.filter((c) => c.id !== contactId);
  const base: ColumnsState = { ...columns, call_later: nextCallLater };

  const prevAttempts = contact.attemptCount ?? 0;
  const nextAttemptCount = prevAttempts + 1;

  if (nextAttemptCount > 3) {
    const cleaned: Contact = { ...contact };
    delete cleaned.scheduledAt;
    delete cleaned.tiparLaterGraceEndsAt;
    return {
      ...base,
      backlog: [...base.backlog, cleaned],
    };
  }

  const durationMs = getToCallLockDuration("tipar", nextAttemptCount);
  const moved: Contact = {
    ...contact,
    attemptCount: nextAttemptCount,
    statusUpdatedAt: now,
    lockedUntil: now + durationMs,
  };
  delete moved.scheduledAt;
  delete moved.tiparLaterGraceEndsAt;

  return {
    ...base,
    to_call: [...base.to_call, moved],
  };
}

/** UI volá přes `onDragEnd` po platném dropu, ne při průběžném dragOver. */
function moveContactBetweenColumns(
  columns: ColumnsState,
  contactId: string,
  source: ColumnId,
  target: ColumnId,
): ColumnsState {
  if (!isMoveAllowed(source, target)) {
    return columns;
  }

  if (source === target) {
    return columns;
  }

  const sourceContacts = columns[source];
  const targetContacts = columns[target];

  const contact = sourceContacts.find((item) => item.id === contactId);
  if (!contact) {
    return columns;
  }

  const now = Date.now();
  let updatedContact = contact;

  if (target === "to_call") {
    const base = updatedContact;
    const nextAttemptCount =
      source === "backlog"
        ? Math.max(1, base.attemptCount ?? 0)
        : source === "call_later"
          ? (base.attemptCount ?? 0) + 1
          : Math.max(1, base.attemptCount ?? 0);

    if (source === "call_later" && nextAttemptCount > 3) {
      const cleaned: Contact = { ...base };
      delete cleaned.scheduledAt;
      delete cleaned.tiparLaterGraceEndsAt;
      delete cleaned.lockedUntil;
      return {
        ...columns,
        [source]: sourceContacts.filter((item) => item.id !== contactId),
        backlog: [...columns.backlog, cleaned],
      };
    }

    const durationMs = getToCallLockDuration(base.source, nextAttemptCount);

    updatedContact = {
      ...base,
      attemptCount: nextAttemptCount,
      statusUpdatedAt: now,
      lockedUntil: now + durationMs,
    };
    delete updatedContact.scheduledAt;
  }

  if (source === "call_later" && target !== "call_later") {
    updatedContact = { ...updatedContact };
    delete updatedContact.tiparLaterGraceEndsAt;
  }

  return {
    ...columns,
    [source]: sourceContacts.filter((item) => item.id !== contactId),
    [target]: [...targetContacts, updatedContact],
  };
}

/** Nová instance kontaktu bez runtime polí — vhodné po refreshi (vše v backlogu). */
function createPristineContact(c: Contact): Contact {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    type: c.type,
    subtype: c.subtype,
    city: c.city,
    source: c.source,
    time: c.time,
    createdAt: c.createdAt,
    attemptCount: 0,
  };
}

function createInitialColumns(): ColumnsState {
  return {
    backlog: MOCK_CONTACTS_ALL.map(createPristineContact),
    to_call: [],
    meeting: [],
    call_later: [],
    listed: [],
    disqualified: [],
  };
}

export function useCallingBoardState() {
  const [columns, setColumns] = useState<ColumnsState>(() => createInitialColumns());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setColumns((current) => {
        const now = Date.now();
        let next = applyExpiredToCallHandling(current, now);

        const tiparGraceEndMs = (c: (typeof next.call_later)[0]) => {
          if (typeof c.tiparLaterGraceEndsAt === "number") return c.tiparLaterGraceEndsAt;
          if (typeof c.scheduledAt === "number") return c.scheduledAt + TIPAR_CALL_LATER_GRACE_MS;
          return 0;
        };

        const tiparGraceElapsed = next.call_later.filter(
          (c) =>
            c.source === "tipar" &&
            typeof c.scheduledAt === "number" &&
            now >= tiparGraceEndMs(c),
        );

        const callLaterReadyToReturn = next.call_later.filter(
          (c) =>
            c.source !== "tipar" &&
            typeof c.scheduledAt === "number" &&
            now >= c.scheduledAt + CALL_LATER_OTHER_GRACE_MS,
        );

        if (
          next === current &&
          tiparGraceElapsed.length === 0 &&
          callLaterReadyToReturn.length === 0
        ) {
          return current;
        }

        for (const c of tiparGraceElapsed) {
          next = applyTiparCallLaterGraceElapsed(next, c.id, now);
        }

        for (const c of callLaterReadyToReturn) {
          next = moveContactBetweenColumns(next, c.id, "call_later", "to_call");
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  function getContactColumnId(current: ColumnsState, contactId: string): ColumnId | null {
    for (const [columnId, items] of Object.entries(current) as [ColumnId, Contact[]][]) {
      if (items.some((c) => c.id === contactId)) return columnId;
    }
    return null;
  }

  function onDragEnd(contactId: string, source: DragLocation, target: DragLocation) {
    if (!target.columnId) {
      return;
    }

    setColumns((current) => {
      const currentSource = getContactColumnId(current, contactId) ?? source.columnId;
      return moveContactBetweenColumns(current, contactId, currentSource, target.columnId);
    });
  }

  function moveContact(contactId: string, targetColumnId: ColumnId) {
    setColumns((current) => {
      const sourceColumnId = getContactColumnId(current, contactId);
      if (!sourceColumnId) return current;
      return moveContactBetweenColumns(current, contactId, sourceColumnId, targetColumnId);
    });
  }

  function scheduleMoveContact(
    contact: Contact,
    targetColumn: "meeting" | "call_later",
    scheduledAt: number,
  ) {
    setColumns((current) => {
      const sourceColumnId = getContactColumnId(current, contact.id);
      if (!sourceColumnId) return current;

      if (!isMoveAllowed(sourceColumnId, targetColumn)) return current;

      const sourceContacts = current[sourceColumnId];
      const found = sourceContacts.find((c) => c.id === contact.id);
      if (!found) return current;

      const now = Date.now();
      const updatedContact: Contact = {
        ...found,
        statusUpdatedAt: now,
        scheduledAt,
      };

      if (found.source === "tipar" && targetColumn === "call_later") {
        updatedContact.tiparLaterGraceEndsAt =
          scheduledAt <= now
            ? now + TIPAR_CALL_LATER_GRACE_MS
            : scheduledAt + TIPAR_CALL_LATER_GRACE_MS;
      } else if (found.source === "tipar" && targetColumn === "meeting") {
        delete updatedContact.tiparLaterGraceEndsAt;
      }

      return {
        ...current,
        [sourceColumnId]: sourceContacts.filter((c) => c.id !== contact.id),
        [targetColumn]: [...current[targetColumn], updatedContact],
      };
    });
  }

  return {
    columns,
    onDragEnd,
    moveContact,
    scheduleMoveContact,
  };
}
