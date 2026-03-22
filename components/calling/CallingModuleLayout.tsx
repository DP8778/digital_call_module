"use client";

import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useEffect, useMemo, useState } from "react";
import { columnContainerPointerCollision, dropTargetColumnId } from "./columnPointerCollision";
import { isMoveAllowed } from "./allowedMoves";
import Backlog from "./backlog/Backlog";
import KanbanBoard from "./kanban/KanbanBoard";
import type { ColumnId, Contact } from "./types";
import ScheduleModal from "./ScheduleModal";
import { useCallingBoardState } from "./useCallingBoardState";

export default function CallingModuleLayout() {
  const board = useCallingBoardState();
  const [mounted, setMounted] = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [dragSourceColumnId, setDragSourceColumnId] = useState<ColumnId | null>(null);
  const [scheduleModalData, setScheduleModalData] = useState<{
    contact: Contact;
    targetColumn: "meeting" | "call_later";
  } | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const activeContact = useMemo<Contact | null>(() => {
    if (!activeContactId) return null;
    const all = Object.values(board.columns).flat();
    return all.find((c) => c.id === activeContactId) ?? null;
  }, [activeContactId, board.columns]);

  function getContactColumnId(contactId: string): ColumnId | null {
    for (const [columnId, items] of Object.entries(board.columns) as [ColumnId, Contact[]][]) {
      if (items.some((c) => c.id === contactId)) return columnId;
    }
    return null;
  }

  function getContactById(contactId: string): Contact | null {
    for (const items of Object.values(board.columns)) {
      const found = items.find((c) => c.id === contactId);
      if (found) return found;
    }
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveContactId(String(event.active.id));
    const sourceColumnId = event.active.data.current?.columnId as ColumnId | undefined;
    setDragSourceColumnId(sourceColumnId ?? null);
  }

  function handleDragCancel() {
    setActiveContactId(null);
    setDragSourceColumnId(null);
  }

  function handleDragEnd(event: DragEndEvent) {
    const contactId = String(event.active.id);
    const targetColumnId = dropTargetColumnId(event.over);

    setActiveContactId(null);
    setDragSourceColumnId(null);

    const sourceColumnId = getContactColumnId(contactId);
    if (!sourceColumnId) return;

    if (sourceColumnId === "backlog") {
      if (targetColumnId !== "to_call") return;
      if (!isMoveAllowed("backlog", "to_call")) return;
      board.onDragEnd(
        contactId,
        { columnId: sourceColumnId },
        { columnId: "to_call" },
      );
      return;
    }

    if (!targetColumnId) return;

    if (targetColumnId === "meeting" || targetColumnId === "call_later") {
      if (!isMoveAllowed(sourceColumnId, targetColumnId)) return;

      const contact = getContactById(contactId);
      if (!contact) return;

      setScheduleModalData({
        contact,
        targetColumn: targetColumnId,
      });
      return;
    }

    if (!isMoveAllowed(sourceColumnId, targetColumnId)) return;

    board.onDragEnd(
      contactId,
      { columnId: sourceColumnId },
      { columnId: targetColumnId },
    );
  }

  if (!mounted) {
    return null;
  }

  return (
    <DndContext
      collisionDetection={columnContainerPointerCollision}
      onDragStart={handleDragStart}
      onDragCancel={handleDragCancel}
      onDragEnd={handleDragEnd}
    >
      {/*
        Mobil: sloupec — Backlog nahoře, Kanban dole, min. výška viewportu, bez fixního h-screen.
        Tablet (md): řádek 40/60, stále < lg bez fixního h-screen.
        Desktop (lg): h-screen + overflow-hidden, scroll jen uvnitř sloupců.
      */}
      <div className="flex w-full min-h-screen flex-col bg-zinc-50 dark:bg-[#1f2937] md:flex-row lg:h-screen lg:min-h-0 lg:overflow-hidden">
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col border-b border-zinc-200 md:w-[40%] md:flex-none md:border-b-0 md:border-r md:border-zinc-200 dark:border-zinc-700 lg:h-full lg:w-[40%]">
          <header className="shrink-0 border-b border-zinc-200 px-4 py-2 dark:border-zinc-700">
            <h1 className="truncate text-sm font-semibold text-zinc-900 dark:text-[#f9fafb]">
              Modul pro obvolávání
            </h1>
            
          </header>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Backlog
              contacts={board.columns.backlog}
              dragSourceColumnId={dragSourceColumnId}
              onMoveContact={board.moveContact}
            />
          </div>
        </div>
        <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden md:w-[60%] md:flex-none lg:h-full lg:w-[60%]">
          <KanbanBoard
            columns={board.columns}
            dragSourceColumnId={dragSourceColumnId}
            onMoveContact={board.moveContact}
            onRequestSchedule={(contact, targetColumn) =>
              setScheduleModalData({ contact, targetColumn })
            }
          />
        </div>
      </div>

      <DragOverlay>
        {activeContact ? (
          <div className="w-[320px] rounded-lg border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-600 dark:bg-[#111827]">
            <div className="truncate text-sm font-semibold text-zinc-900 dark:text-[#f9fafb]">
              {activeContact.name}
            </div>
            <div className="mt-1 truncate text-xs text-zinc-700 dark:text-zinc-300">
              <span className="text-zinc-500 dark:text-zinc-400">Tel.</span>{" "}
              <span className="font-medium text-zinc-900 dark:text-[#f9fafb]">
                {activeContact.phone}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {scheduleModalData ? (
        <ScheduleModal
          isOpen={true}
          onClose={() => setScheduleModalData(null)}
          onConfirm={(timestamp) => {
            board.scheduleMoveContact(
              scheduleModalData.contact,
              scheduleModalData.targetColumn,
              timestamp,
            );
          }}
          contact={scheduleModalData.contact}
          targetColumn={scheduleModalData.targetColumn}
        />
      ) : null}
    </DndContext>
  );
}
