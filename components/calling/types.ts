export type ColumnType =
  | "to_call"
  | "meeting"
  | "call_later"
  | "listed"
  | "disqualified";

/** Identifikátor sloupce včetně zásobníku (backlog není Kanban sloupec). */
export type ColumnId = ColumnType | "backlog";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: "prodej" | "pronajem";
  subtype: string;
  city: string;
  source: "inzerce" | "tipar" | "fb" | "callcentrum";
  /** Zobrazení času v kartě (typicky HH:MM). */
  time: string;
  /** Datum a čas vytvoření záznamu v systému (YYYY-MM-DD HH:MM). */
  createdAt: string;
  // Time-based lock handling (timestamp in ms). When set, contact is considered locked until that time.
  lockedUntil?: number;
  // Timestamp (ms) for when the contact was last moved to the current column.
  statusUpdatedAt?: number;
  // Timestamp (ms) representing when a move into a scheduled column should happen.
  scheduledAt?: number;
  // Number of attempts made when moving the contact into to_call.
  attemptCount?: number;
  /** Tipař v call_later: wall-clock okamžik auto-přesunu (scheduledAt + 20 s, nebo now + 20 s při zpětném termínu). */
  tiparLaterGraceEndsAt?: number;
};
