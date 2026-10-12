export type ColumnId =
  | "backlog"
  | "to_call"
  | "call_later"
  | "meeting"
  | "listed"
  | "disqualified";

export type ColumnType = Exclude<ColumnId, "backlog">;

export type ContactSource = "inzerce" | "tipar" | "fb" | "callcentrum";
export type ActivityType = "call" | "meeting";

export type NextActivity = {
  id: string;
  type: ActivityType;
  dueAt: number;
};

export type TimelineEntry = {
  id: string;
  at: number;
  type:
    | "created"
    | "call_attempt"
    | "status_change"
    | "activity_scheduled"
    | "activity_cancelled"
    | "activity_completed"
    | "note";
  label: string;
  note?: string;
  outcome?: CallOutcome;
};

export type CallOutcome = "no_answer" | "meeting_booked" | "call_later" | "disqualified";

export type Contact = {
  id: string;
  name: string;
  phone: string;
  email: string;
  type: "prodej" | "pronajem";
  subtype: string;
  city: string;
  source: ContactSource;
  status: ColumnId;
  createdAt: number;
  statusUpdatedAt: number;
  nextActivity: NextActivity | null;
  history: TimelineEntry[];
};

export type DemoState = {
  schemaVersion: number;
  updatedAt: number;
  contacts: Contact[];
};

export type OutcomeInput = {
  outcome: CallOutcome;
  note: string;
  scheduledAt?: number;
};

export type ScheduleInput = {
  activityType: ActivityType;
  dueAt: number;
};

export type ActionFeedback = {
  title: string;
  description: string;
  nextStep?: string;
};
