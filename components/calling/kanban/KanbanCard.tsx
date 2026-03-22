import { allowedMoves, COLUMN_LABEL_CS } from "../allowedMoves";
import type { ColumnId, ColumnType, Contact } from "../types";
import { TIPAR_CALL_LATER_GRACE_MS } from "../useCallingBoardState";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

type KanbanCardProps = {
  contact: Contact;
  columnId: ColumnType;
  /** Pro meeting / call_later: aktuální čas pro overdue + řazení (1s tick ze sloupce) */
  listNowMs?: number;
  onMoveContact: (contactId: string, target: ColumnId) => void;
  onRequestSchedule: (contact: Contact, targetColumn: "meeting" | "call_later") => void;
};

const TYPE_LABEL: Record<Contact["type"], string> = {
  prodej: "Prodej",
  pronajem: "Pronájem",
};

function isScheduleTarget(target: ColumnId): target is "meeting" | "call_later" {
  return target === "meeting" || target === "call_later";
}

/** Odpočet ve 20s okně po termínu tipaře: vždy MM:SS od 00:20 do 00:00 podle wall-clock (scheduledAt + grace). */
function formatTiparCallLaterGraceCountdown(remainingMs: number): string {
  const sec = Math.min(
    TIPAR_CALL_LATER_GRACE_MS / 1000,
    Math.max(0, Math.ceil(remainingMs / 1000)),
  );
  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function formatDurationCountdownHms(remainingMs: number): string {
  const totalSec = Math.max(0, Math.floor(remainingMs / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function KanbanCard({
  contact,
  columnId,
  listNowMs,
  onMoveContact,
  onRequestSchedule,
}: KanbanCardProps) {
  const typeLabel = TYPE_LABEL[contact.type];
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuTargets = allowedMoves[columnId];

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const isLockedInToCall =
    columnId === "to_call" && typeof contact.lockedUntil === "number";

  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!isLockedInToCall) return;

    const intervalId = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isLockedInToCall, contact.lockedUntil]);

  const countdown = useMemo(() => {
    if (!isLockedInToCall || typeof contact.lockedUntil !== "number") return null;

    const remainingMs = Math.max(0, contact.lockedUntil - nowMs);
    const totalSec = Math.floor(remainingMs / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;

    const hh = String(hours).padStart(2, "0");
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }, [contact.lockedUntil, isLockedInToCall, nowMs]);

  const scheduleTickMs = listNowMs ?? nowMs;

  const showTiparCallLaterCountdown =
    columnId === "call_later" &&
    contact.source === "tipar" &&
    typeof contact.scheduledAt === "number";

  const tiparLaterGraceEndsAt =
    typeof contact.tiparLaterGraceEndsAt === "number"
      ? contact.tiparLaterGraceEndsAt
      : typeof contact.scheduledAt === "number"
        ? contact.scheduledAt + TIPAR_CALL_LATER_GRACE_MS
        : null;

  const needsTiparLaterTick =
    showTiparCallLaterCountdown && tiparLaterGraceEndsAt !== null;

  const [tiparLaterNowMs, setTiparLaterNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!needsTiparLaterTick) return;
    const id = setInterval(() => setTiparLaterNowMs(Date.now()), 250);
    return () => clearInterval(id);
  }, [needsTiparLaterTick, contact.scheduledAt, contact.tiparLaterGraceEndsAt]);

  const tiparLaterTickMs = needsTiparLaterTick ? tiparLaterNowMs : scheduleTickMs;

  /** Tipař po termínu: červená přesně do tiparLaterGraceEndsAt (20 s wall-clock od uložení / od termínu). */
  const isTiparCallLaterPostDeadlineGrace =
    columnId === "call_later" &&
    contact.source === "tipar" &&
    typeof contact.scheduledAt === "number" &&
    tiparLaterGraceEndsAt !== null &&
    tiparLaterTickMs >= contact.scheduledAt &&
    tiparLaterTickMs < tiparLaterGraceEndsAt;

  const tiparCallLaterCountdown = useMemo(() => {
    if (!showTiparCallLaterCountdown || typeof contact.scheduledAt !== "number" || tiparLaterGraceEndsAt === null)
      return null;

    const t = tiparLaterTickMs;
    const sched = contact.scheduledAt;
    const graceEnd = tiparLaterGraceEndsAt;

    if (t < sched) {
      return formatDurationCountdownHms(sched - t);
    }
    if (t < graceEnd) {
      return formatTiparCallLaterGraceCountdown(graceEnd - t);
    }
    return null;
  }, [
    contact.scheduledAt,
    showTiparCallLaterCountdown,
    tiparLaterGraceEndsAt,
    tiparLaterTickMs,
  ]);

  const isOverdue =
    (columnId === "meeting" || columnId === "call_later") &&
    typeof contact.scheduledAt === "number" &&
    contact.scheduledAt < scheduleTickMs;

  const overdueCallLater =
    columnId === "call_later" &&
    isOverdue &&
    !(contact.source === "tipar" && isTiparCallLaterPostDeadlineGrace);
  const overdueMeeting = columnId === "meeting" && isOverdue;

  const scheduledAtLabel = useMemo(() => {
    if (typeof contact.scheduledAt !== "number") return null;

    const d = new Date(contact.scheduledAt);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = String(d.getFullYear()).slice(-2);
    const HH = String(d.getHours()).padStart(2, "0");
    const MM = String(d.getMinutes()).padStart(2, "0");

    return `Naplánováno: ${dd}.${mm}.${yy} ${HH}:${MM}`;
  }, [contact.scheduledAt]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: contact.id,
      data: { columnId },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "relative rounded-lg border p-3",
        isTiparCallLaterPostDeadlineGrace
          ? "border-red-500 bg-red-50 ring-2 ring-red-200 dark:border-red-500 dark:bg-red-950/40 dark:ring-red-200/80"
          : overdueCallLater
            ? "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-950/40"
            : overdueMeeting
              ? "border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/40"
              : "border-zinc-200 bg-white dark:border-zinc-600 dark:bg-[#111827]",
        "cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-0" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      {menuTargets.length > 0 ? (
        <div ref={menuRef} className="absolute right-2 top-2 z-20">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-lg leading-none text-zinc-600 shadow-sm hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Akce s kontaktem"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            ⋯
          </button>
          {menuOpen ? (
            <ul
              className="absolute right-0 mt-1 min-w-[220px] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-600 dark:bg-[#111827]"
              role="menu"
            >
              {menuTargets.map((target) => (
                <li key={target} role="none">
                  <button
                    type="button"
                    role="menuitem"
                    className="w-full px-3 py-2 text-left text-xs text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      if (isScheduleTarget(target)) {
                        onRequestSchedule(contact, target);
                      } else {
                        onMoveContact(contact.id, target);
                      }
                    }}
                  >
                    Přesunout do {COLUMN_LABEL_CS[target]}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-start justify-between gap-3 pr-8">
        <div className="min-w-0">
          <div className="space-y-0.5 text-xs text-zinc-700 dark:text-zinc-300">
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Tel.</span>{" "}
              <span className="font-medium text-zinc-900 dark:text-[#f9fafb]">
                {contact.phone}
              </span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Email</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{contact.email}</span>
            </div>
            <div className="truncate text-sm font-semibold text-zinc-900 dark:text-[#f9fafb]">
              {contact.name}
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Typ</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{typeLabel}</span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Podtyp</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{contact.subtype}</span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Město</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{contact.city}</span>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
            {typeLabel}
          </span>
          {isLockedInToCall && countdown ? (
            <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <span className="mr-1 inline-block">🔒</span>
              {countdown}
            </span>
          ) : null}
          {showTiparCallLaterCountdown && tiparCallLaterCountdown ? (
            <span
              className={[
                "rounded-md border px-2 py-1 text-[11px] font-medium tabular-nums",
                isTiparCallLaterPostDeadlineGrace
                  ? "border-red-300 bg-red-100 text-red-900 dark:border-red-400 dark:bg-red-950/70 dark:text-red-100"
                  : "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/50 dark:text-amber-100",
              ].join(" ")}
            >
              {tiparCallLaterCountdown}
            </span>
          ) : null}
          {isTiparCallLaterPostDeadlineGrace ? (
            <span className="rounded-md border border-red-400 bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-800 dark:border-red-500 dark:bg-red-950/60 dark:text-red-100">
              Po termínu
            </span>
          ) : null}
          {overdueMeeting ? (
            <span className="rounded-md border border-blue-300 bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-800 dark:border-blue-500 dark:bg-blue-950/50 dark:text-blue-100">
              Proběhlá schůzka
            </span>
          ) : null}
          {scheduledAtLabel ? (
            <span className="rounded-md border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {scheduledAtLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
