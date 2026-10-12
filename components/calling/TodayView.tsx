"use client";

import { AlertCircle, CalendarClock, ChevronRight, CircleCheck, Inbox, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import { SOURCE_LABEL } from "./labels";
import {
  formatAttemptCount,
  formatCzechCount,
  getAttentionReason,
  getQueueGroup,
  needsAttentionNow,
  type QueueGroupId,
} from "./queueLogic";
import { getAttemptCount } from "./stateLogic";
import StatusPill from "./StatusPill";
import type { ColumnId, Contact, ContactSource } from "./types";

const GROUP_META: Record<QueueGroupId, { title: string; description: string }> = {
  missed: { title: "Zmeškané", description: "Termín už uplynul — rozhodněte o dalším kroku" },
  today: { title: "Dnes", description: "Připravené nyní nebo naplánované na zbytek dne" },
  later: { title: "Později", description: "Aktivity po dnešku; nyní nevyžadují zásah" },
  unscheduled: { title: "Bez termínu", description: "Kontakty bez určené příští aktivity" },
};

type Props = {
  contacts: Contact[];
  now: number;
  onOpenContact: (contact: Contact) => void;
};

export default function TodayView({ contacts, now, onOpenContact }: Props) {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | ContactSource>("all");
  const [status, setStatus] = useState<"all" | ColumnId>("all");

  const activeContacts = useMemo(
    () => contacts.filter((contact) => contact.status !== "listed" && contact.status !== "disqualified"),
    [contacts],
  );
  const filtersActive = query.trim() !== "" || source !== "all" || status !== "all";

  const filteredContacts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("cs");
    return activeContacts
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
  }, [activeContacts, query, source, status]);

  const groups = useMemo(() => (Object.keys(GROUP_META) as QueueGroupId[]).map((id) => ({
    id,
    ...GROUP_META[id],
    contacts: filteredContacts.filter((contact) => getQueueGroup(contact, now) === id),
  })), [filteredContacts, now]);

  const attentionNow = filteredContacts.filter((contact) => needsAttentionNow(contact, now)).length;
  const todayRemaining = groups.find((group) => group.id === "today")?.contacts.filter((contact) => !needsAttentionNow(contact, now)).length ?? 0;

  function clearFilters() {
    setQuery("");
    setSource("all");
    setStatus("all");
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <div className="mb-5">
        <p className="text-sm font-semibold text-teal-700">Pracovní fronta</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Dnes / K řešení</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">Nejdřív vyřešte prošlé termíny a kontakty připravené k hovoru.</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Souhrn pracovní fronty">
            <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${attentionNow > 0 ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>
              {attentionNow > 0 ? `${formatCzechCount(attentionNow, ["úkol", "úkoly", "úkolů"])} právě teď` : "Nic naléhavého"}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{formatCzechCount(todayRemaining, ["úkol", "úkoly", "úkolů"])} ještě dnes</span>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <label className="relative block">
          <span className="sr-only">Hledat kontakt</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jméno, město, nemovitost…" className={`focus-ring h-11 w-full rounded-xl border bg-slate-50 pl-9 pr-3 text-sm text-slate-950 placeholder:text-slate-400 ${query.trim() ? "border-teal-500" : "border-slate-200"}`} />
        </label>
        <label>
          <span className="sr-only">Filtrovat podle zdroje</span>
          <select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className={`focus-ring h-11 w-full rounded-xl border bg-white px-3 text-sm ${source !== "all" ? "border-teal-500 text-teal-900" : "border-slate-200"}`}>
            <option value="all">Všechny zdroje</option>
            {Object.entries(SOURCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="sr-only">Filtrovat podle stavu</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={`focus-ring h-11 w-full rounded-xl border bg-white px-3 text-sm ${status !== "all" ? "border-teal-500 text-teal-900" : "border-slate-200"}`}>
            <option value="all">Všechny stavy</option>
            {(["backlog", "to_call", "call_later", "meeting"] as ColumnId[]).map((value) => <option key={value} value={value}>{COLUMN_LABEL_CS[value]}</option>)}
          </select>
        </label>
      </div>

      {filtersActive ? (
        <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Aktivní filtry">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Aktivní výběr</span>
          {query.trim() ? <button type="button" onClick={() => setQuery("")} className="focus-ring inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">„{query.trim()}“ <X className="size-3" aria-hidden="true" /></button> : null}
          {source !== "all" ? <button type="button" onClick={() => setSource("all")} className="focus-ring inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">{SOURCE_LABEL[source]} <X className="size-3" aria-hidden="true" /></button> : null}
          {status !== "all" ? <button type="button" onClick={() => setStatus("all")} className="focus-ring inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800">{COLUMN_LABEL_CS[status]} <X className="size-3" aria-hidden="true" /></button> : null}
          <button type="button" onClick={clearFilters} className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 underline-offset-2 hover:text-slate-950 hover:underline">Zobrazit celou frontu</button>
        </div>
      ) : <div className="mb-2" />}

      {filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          {filtersActive ? <Inbox className="mx-auto size-8 text-slate-400" aria-hidden="true" /> : <CircleCheck className="mx-auto size-8 text-emerald-600" aria-hidden="true" />}
          <h2 className="mt-3 font-semibold text-slate-900">{filtersActive ? "Žádná shoda s aktivním výběrem" : "Ve frontě není žádná otevřená práce"}</h2>
          <p className="mt-1 text-sm text-slate-500">{filtersActive ? "Zrušte některý filtr nebo se vraťte k celé frontě." : "Všechny aktivní kontakty jsou zpracované."}</p>
          {filtersActive ? <button type="button" onClick={clearFilters} className="button-secondary mt-5">Zobrazit celou frontu</button> : null}
        </div>
      ) : (
        <div className="space-y-7">
          {groups.filter((group) => group.contacts.length > 0).map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {group.id === "missed" ? <AlertCircle className="size-4 self-center text-rose-600" aria-hidden="true" /> : <CalendarClock className="size-4 self-center text-slate-500" aria-hidden="true" />}
                <h2 id={`group-${group.id}`} className="font-semibold text-slate-950">{group.title}</h2>
                <span className="text-sm text-slate-500">{group.contacts.length}</span>
                <span className="text-sm text-slate-400">· {group.description}</span>
              </div>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                {group.contacts.map((contact, index) => (
                  <button key={contact.id} type="button" onClick={() => onOpenContact(contact)} className={`focus-ring group grid w-full gap-3 px-4 py-4 text-left hover:bg-slate-50 sm:grid-cols-[minmax(180px,1.2fr)_minmax(210px,1fr)_auto_24px] sm:items-center ${index > 0 ? "border-t border-slate-100" : ""}`}>
                    <div className="min-w-0"><div className="truncate font-semibold text-slate-950">{contact.name}</div><div className="mt-1 truncate text-sm text-slate-500">{contact.subtype} · {contact.city}</div></div>
                    <div className="min-w-0"><div className={`text-sm font-medium ${group.id === "missed" ? "text-rose-700" : "text-slate-800"}`}>{getAttentionReason(contact, now)}</div><div className="mt-1 text-xs text-slate-500">{SOURCE_LABEL[contact.source]} · {formatAttemptCount(getAttemptCount(contact))}</div></div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusPill status={contact.status} /></div>
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
