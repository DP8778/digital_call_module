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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-9">
      <div className="mb-6">
        <p className="eyebrow">Pracovní fronta</p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-main text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">Dnes / K řešení</h1>
            <p className="text-muted mt-1.5 max-w-2xl text-sm leading-relaxed">Nejdřív vyřešte prošlé termíny a kontakty připravené k hovoru.</p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Souhrn pracovní fronty">
            <span className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${attentionNow > 0 ? "tone-danger" : "tone-success"}`}>
              {attentionNow > 0 ? `${formatCzechCount(attentionNow, ["úkol", "úkoly", "úkolů"])} právě teď` : "Nic naléhavého"}
            </span>
            <span className="tone-neutral rounded-full border px-3 py-1.5 text-sm font-medium">{formatCzechCount(todayRemaining, ["úkol", "úkoly", "úkolů"])} ještě dnes</span>
          </div>
        </div>
      </div>

      <div className="content-surface mb-4 grid gap-3 p-4 sm:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <label className="block">
          <span className="text-muted mb-1.5 block text-xs font-semibold">Hledat kontakt</span>
          <span className="relative block">
            <Search className="text-faint pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Jméno, město, nemovitost…" className={`field h-11 w-full pl-9 pr-3 text-sm ${query.trim() ? "border-[var(--dc-accent)]" : ""}`} />
          </span>
        </label>
        <label>
          <span className="text-muted mb-1.5 block text-xs font-semibold">Zdroj</span>
          <select value={source} onChange={(event) => setSource(event.target.value as typeof source)} className={`field h-11 w-full px-3 text-sm ${source !== "all" ? "border-[var(--dc-accent)]" : ""}`}>
            <option value="all">Všechny zdroje</option>
            {Object.entries(SOURCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="text-muted mb-1.5 block text-xs font-semibold">Procesní stav</span>
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className={`field h-11 w-full px-3 text-sm ${status !== "all" ? "border-[var(--dc-accent)]" : ""}`}>
            <option value="all">Všechny stavy</option>
            {(["backlog", "to_call", "call_later", "meeting"] as ColumnId[]).map((value) => <option key={value} value={value}>{COLUMN_LABEL_CS[value]}</option>)}
          </select>
        </label>
      </div>

      {filtersActive ? (
        <div className="mb-6 flex flex-wrap items-center gap-2" aria-label="Aktivní filtry">
          <span className="text-muted text-xs font-semibold uppercase tracking-wide">Aktivní výběr</span>
          {query.trim() ? <button type="button" onClick={() => setQuery("")} className="tone-accent focus-ring inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">„{query.trim()}“ <X className="size-3" aria-hidden="true" /></button> : null}
          {source !== "all" ? <button type="button" onClick={() => setSource("all")} className="tone-accent focus-ring inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">{SOURCE_LABEL[source]} <X className="size-3" aria-hidden="true" /></button> : null}
          {status !== "all" ? <button type="button" onClick={() => setStatus("all")} className="tone-accent focus-ring inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium">{COLUMN_LABEL_CS[status]} <X className="size-3" aria-hidden="true" /></button> : null}
          <button type="button" onClick={clearFilters} className="button-quiet h-8 px-2 text-xs">Zobrazit celou frontu</button>
        </div>
      ) : <div className="mb-2" />}

      {filteredContacts.length === 0 ? (
        <div className="content-surface border-dashed px-5 py-14 text-center">
          {filtersActive ? <Inbox className="text-faint mx-auto size-8" aria-hidden="true" /> : <CircleCheck className="mx-auto size-8 text-[var(--dc-success)]" aria-hidden="true" />}
          <h2 className="text-main mt-3 font-semibold">{filtersActive ? "Žádná shoda s aktivním výběrem" : "Ve frontě není žádná otevřená práce"}</h2>
          <p className="text-muted mt-1 text-sm">{filtersActive ? "Zrušte některý filtr nebo se vraťte k celé frontě." : "Všechny aktivní kontakty jsou zpracované."}</p>
          {filtersActive ? <button type="button" onClick={clearFilters} className="button-secondary mt-5">Zobrazit celou frontu</button> : null}
        </div>
      ) : (
        <div className="space-y-7">
          {groups.filter((group) => group.contacts.length > 0).map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {group.id === "missed" ? <AlertCircle className="size-4 self-center text-[var(--dc-danger)]" aria-hidden="true" /> : <CalendarClock className="text-muted size-4 self-center" aria-hidden="true" />}
                <h2 id={`group-${group.id}`} className="text-main font-semibold">{group.title}</h2>
                <span className="text-muted text-sm">{group.contacts.length}</span>
                <span className="text-faint text-sm">· {group.description}</span>
              </div>
              <div className={`content-surface overflow-hidden ${group.id === "later" ? "opacity-[0.92]" : ""}`} style={group.id === "missed" ? { borderLeftWidth: 3, borderLeftColor: "var(--dc-danger)" } : undefined}>
                {group.contacts.map((contact, index) => (
                  <button key={contact.id} type="button" onClick={() => onOpenContact(contact)} className={`focus-ring group grid w-full gap-3 px-4 py-4 text-left transition-colors duration-150 hover:bg-[var(--dc-surface-subtle)] sm:grid-cols-[minmax(180px,1.2fr)_minmax(210px,1fr)_auto_24px] sm:items-center ${index > 0 ? "border-t border-[var(--dc-border)]" : ""}`}>
                    <div className="min-w-0"><div className="text-main truncate font-semibold">{contact.name}</div><div className="text-muted mt-1 truncate text-sm">{contact.subtype} · {contact.city}</div></div>
                    <div className="min-w-0"><div className={`text-sm font-medium ${group.id === "missed" ? "text-[var(--dc-danger)]" : "text-main"}`}>{getAttentionReason(contact, now)}</div><div className="text-muted mt-1 text-xs">{SOURCE_LABEL[contact.source]} · {formatAttemptCount(getAttemptCount(contact))}</div></div>
                    <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusPill status={contact.status} /></div>
                    <ChevronRight className="text-faint hidden size-4 transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden="true" />
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
