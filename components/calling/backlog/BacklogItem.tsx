import { allowedMoves, COLUMN_LABEL_CS } from "../allowedMoves";
import type { ColumnId, Contact } from "../types";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";

type BacklogItemProps = {
  contact: Contact;
  onMoveContact: (contactId: string, target: ColumnId) => void;
};

const TYPE_LABEL: Record<Contact["type"], string> = {
  prodej: "Prodej",
  pronajem: "Pronájem",
};

const SOURCE_LABEL: Record<Contact["source"], string> = {
  fb: "FB kampaň",
  inzerce: "Inzerce",
  tipar: "Tipař",
  callcentrum: "Call centrum",
};

export default function BacklogItem({ contact, onMoveContact }: BacklogItemProps) {
  const typeLabel = TYPE_LABEL[contact.type];
  const sourceLabel = SOURCE_LABEL[contact.source];
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const menuTargets = allowedMoves.backlog;

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: PointerEvent) {
      if (menuRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [menuOpen]);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
      id: contact.id,
      data: { columnId: "backlog" },
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
        "relative rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-600 dark:bg-[#111827]",
        "cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-0" : "",
      ].join(" ")}
      {...attributes}
      {...listeners}
    >
      {menuTargets.length > 0 ? (
        <div ref={menuRef} className="absolute right-3 top-3 z-20">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-lg leading-none text-zinc-600 shadow-sm hover:bg-zinc-50"
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
                      onMoveContact(contact.id, target);
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
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">V systému:</span>{" "}
            <span className="tabular-nums">{contact.createdAt}</span>
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-zinc-900 dark:text-[#f9fafb]">
            {contact.name}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-zinc-700 dark:text-zinc-300">
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Tel.:</span>{" "}
              <span className="font-medium text-zinc-900 dark:text-[#f9fafb]">
                {contact.phone}
              </span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Email:</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{contact.email}</span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Typ:</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{typeLabel}</span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Podtyp:</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{contact.subtype}</span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Město:</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{contact.city}</span>
            </div>
            <div className="truncate">
              <span className="text-zinc-500 dark:text-zinc-400">Zdroj:</span>{" "}
              <span className="text-zinc-900 dark:text-[#f9fafb]">{sourceLabel}</span>
            </div>
          </div>
        </div>
        <span className="shrink-0 rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200">
          {typeLabel}
        </span>
      </div>
    </div>
  );
}
