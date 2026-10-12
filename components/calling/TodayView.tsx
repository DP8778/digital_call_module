"use client";

import { AlertCircle, CalendarClock, ChevronRight, Inbox, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import { ACTIVITY_LABEL, SOURCE_LABEL } from "./labels";
import { getAttemptCount } from "./stateLogic";
import StatusPill from "./StatusPill";
import { addPragueCalendarDays, pragueDayStart, relativeDayLabel } from "./time";
import type { ColumnId, Contact, ContactSource } from "./types";

type GroupId = "missed" | "today" | "later" | "unscheduled";

const GROUP_META: Record<GroupId, { title: string; description: string }> = {
  missed: { title: "Zmeškané", description: "Aktivity po termínu, které potřebují rozhodnutí" },
  today: { title: "Dnes", description: "Naplánované na dnešek nebo připravené k řešení" },
  later: { title: "Později", description: "Budoucí hovory a schůzky" },
  unscheduled: { title: "Bez termínu", description: "Kontakty, u kterých chybí další krok" },
};

function groupFor(contact: Contact, now: number): GroupId {
  if (!contact.nextActivity) return contact.status === "to_call" ? "today" : "unscheduled";
  const start = pragueDayStart(now);
  const tomorrow = addPragueCalendarDays(start, 1, 0);
  if (contact.nextActivity.dueAt < start) return "missed";
  if (contact.nextActivity.dueAt < tomorrow) return "today";
  return "later";
}

function reasonFor(contact: Contact, now: number): string {
  if (!contact.nextActivity) {
    return contact.status === "to_call" ? "Připraveno k provolání" : "Chybí naplánovaný další krok";
  }
  const past = contact.nextActivity.dueAt < now;
  if (past) return contact.nextActivity.type === "call" ? "Hovor je po termínu" : "Schůzka je po termínu";
  return `${ACTIVITY_LABEL[contact.nextActivity.type]} · ${relativeDayLabel(contact.nextActivity.dueAt, now)}`;
}

type Props = {
  contacts: Contact[];
  now: number;
  onOpenContact: (contact: Contact) => void;
};

export default function TodayView({ contacts, now, onOpenContact }: Props) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | ContactSource>("all");
  const [status, setStatus] = useState<"all" | ColumnId>("all");

  const groups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("cs");
    const filtered = contacts
      .filter((contact) => contact.status !== "listed" && contact.status !== "disqualified")
      .filter((contact) => source === "all" || contact.source === source)
      .filter((contact) => status === "all" || contact.status === status)
      .filter((contact) => {
        if (!normalized) return true;
        return [contact.name, contact.city, contact.subtype, contact.phone, contact.email]
          .join(" ")
          .toLocaleLowerCase("cs")
          .includes(normalized);
      })
      .sort((a, b) => {
        const aDue = a.nextActivity?.dueAt ?? Number.POSITIVE_INFINITY;
        const bDue = b.nextActivity?.dueAt ?? Number.POSITIVE_INFINITY;
        return aDue - bDue || a.name.localeCompare(b.name, "cs");
      });
    return (Object.keys(GROUP_META) as GroupId[]).map((id) => ({
      id,
      ...GROUP_META[id],
      contacts: filtered.filter((contact) => groupFor(contact, now) === id),
    }));
  }, [contacts, now, query, source, status]);

  const visibleCount = groups.reduce((sum, group) => sum + group.contacts.length, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="text-sm font-semibold text-teal-700">Pracovní fronta</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Dnes / K řešení</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Začněte zmeškanými aktivitami, potom pokračujte dnešními úkoly.
            </p>
          </div>
          <span className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white">
            {visibleCount} kontaktů
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <label className="relative block">
          <span className="sr-only">Hledat kontakt</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Jméno, město, nemovitost…"
            className="focus-ring h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-950 placeholder:text-slate-400"
          />
        </label>
        <label>
          <span className="sr-only">Filtrovat podle zdroje</span>
          <select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className="focus-ring h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">Všechny zdroje</option>
            {Object.entries(SOURCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrovat podle stavu</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="focus-ring h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">
            <option value="all">Všechny stavy</option>
            {(["backlog", "to_call", "call_later", "meeting"] as ColumnId[]).map((value) => <option key={value} value={value}>{COLUMN_LABEL_CS[value]}</option>)}
          </select>
        </label>
      </div>

      {visibleCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <Inbox className="mx-auto size-8 text-slate-400" aria-hidden="true" />
          <h2 className="mt-3 font-semibold text-slate-900">Žádný kontakt neodpovídá filtrům</h2>
          <p className="mt-1 text-sm text-slate-500">Zkuste upravit hledání nebo některý filtr.</p>
        </div>
      ) : (
        <div className="space-y-7">
          {groups.filter((group) => group.contacts.length > 0).map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="mb-2 flex items-center gap-2">
                {group.id === "missed" ? <AlertCircle className="size-4 text-rose-600" aria-hidden="true" /> : <CalendarClock className="size-4 text-slate-500" aria-hidden="true" />}
                <h2 id={`group-${group.id}`} className="font-semibold text-slate-950">{group.title}</h2>
                <span className="text-sm text-slate-500">{group.contacts.length}</span>
                <span className="hidden text-sm text-slate-400 sm:inline">· {group.description}</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {group.contacts.map((contact, index) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => onOpenContact(contact)}
                    className={`focus-ring group grid w-full gap-3 px-4 py-4 text-left hover:bg-slate-50 sm:grid-cols-[minmax(180px,1.2fr)_minmax(180px,1fr)_auto_24px] sm:items-center ${index > 0 ? "border-t border-slate-100" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-semibold text-slate-950">{contact.name}</div>
                      <div className="mt-1 truncate text-sm text-slate-500">{contact.subtype} · {contact.city}</div>
                    </div>
                    <div className="min-w-0">
                      <div className={`text-sm font-medium ${group.id === "missed" ? "text-rose-700" : "text-slate-800"}`}>{reasonFor(contact, now)}</div>
                      <div className="mt-1 text-xs text-slate-500">{SOURCE_LABEL[contact.source]} · {getAttemptCount(contact)} pokusů</div>
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <StatusPill status={contact.status} />
                    </div>
                    <ChevronRight className="hidden size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
