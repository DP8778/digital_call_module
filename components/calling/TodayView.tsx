"use client";

import { AlertCircle, ArrowRight, CalendarClock, ChevronRight, CircleCheck, Inbox, PhoneCall, RotateCcw, Search } from "lucide-react";
import { useMemo } from "react";
import ActiveFilters from "./ActiveFilters";
import { COLUMN_LABEL_CS } from "./allowedMoves";
import { SOURCE_LABEL } from "./labels";
import {
  formatAttemptCount,
  formatCzechCount,
  filterQueueContacts,
  getFirstAttentionContact,
  getQueueGroup,
  getQueueSummary,
  sortQueueContacts,
  type QueueGroupId,
} from "./queueLogic";
import { getQueuePresentation } from "./queuePresentation";
import { getAttemptCount } from "./stateLogic";
import StatusPill from "./StatusPill";
import { formatPragueDateTimePrecise } from "./time";
import type { QueueFilters } from "./uiState";
import type { ColumnId, Contact } from "./types";

const GROUP_META: Record<QueueGroupId, { title: string; description: string }> = {
  missed: { title: "Zmeškané", description: "Termín už uplynul — rozhodněte o dalším kroku" },
  today: { title: "Dnes", description: "Připravené nyní nebo naplánované na zbytek dne" },
  later: { title: "Později", description: "Aktivity po dnešku; nyní nevyžadují zásah" },
  unscheduled: { title: "Bez termínu", description: "Kontakty bez určené příští aktivity" },
};

type Props = {
  contacts: Contact[];
  now: number;
  filters: QueueFilters;
  selectedId: string | null;
  onFiltersChange: (filters: QueueFilters) => void;
  onOpenContact: (contact: Contact) => void;
  onResetDemo: () => void;
};

function QueueContactRow({ contact, now, selected, index, onOpen }: { contact: Contact; now: number; selected: boolean; index: number; onOpen: () => void }) {
  const presentation = getQueuePresentation(contact, now);
  const urgencyInk = presentation.kind === "overdue"
    ? "urgency-overdue-ink"
    : presentation.kind === "ready" || presentation.kind === "missing"
      ? "urgency-ready-ink"
      : "dc-text-muted";

  return (
    <button id={`queue-contact-${contact.id}`} type="button" data-selected={selected} onClick={onOpen} className={`contact-row focus-ring group grid w-full gap-2 px-4 py-3 text-left transition-colors duration-150 hover:bg-[var(--dc-hover)] sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_180px_28px] sm:items-center sm:gap-4 ${index > 0 ? "border-t border-[var(--dc-border)]" : ""}`}>
      <div className="min-w-0"><div className="dc-text-primary truncate font-semibold">{contact.name}</div><div className="dc-text-muted mt-0.5 truncate text-sm">{contact.subtype} · {contact.city}</div></div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className={`dc-text-primary text-sm font-semibold ${presentation.kind !== "missing" ? "md:w-[72px] md:shrink-0" : ""}`}>{presentation.activity}</span>
          {presentation.dueAt !== null ? <time dateTime={new Date(presentation.dueAt).toISOString()} className="dc-text-muted text-sm font-medium lg:w-[150px] lg:shrink-0">{formatPragueDateTimePrecise(presentation.dueAt)}</time> : null}
          {presentation.badge ? <span className={`queue-urgency-label ${urgencyInk}`}>{presentation.kind === "overdue" ? <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" /> : presentation.kind === "ready" ? <PhoneCall className="size-3.5 shrink-0" aria-hidden="true" /> : presentation.kind === "missing" ? <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" /> : null}{presentation.badge}</span> : null}
        </div>
        <div className="dc-text-faint mt-1 text-xs">{SOURCE_LABEL[contact.source]} · {formatAttemptCount(getAttemptCount(contact))}</div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end"><StatusPill status={contact.status} /></div>
      <span className="row-open-indicator hidden size-7 place-items-center rounded-lg sm:grid" aria-hidden="true"><ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" /></span>
    </button>
  );
}

export default function TodayView({ contacts, now, filters, selectedId, onFiltersChange, onOpenContact, onResetDemo }: Props) {
  const filtersActive = filters.query.trim() !== "" || filters.source !== "all" || filters.status !== "all";

  const filteredContacts = useMemo(() => {
    return sortQueueContacts(filterQueueContacts(contacts, filters));
  }, [contacts, filters]);

  const groups = useMemo(() => (Object.keys(GROUP_META) as QueueGroupId[]).map((id) => ({
    id,
    ...GROUP_META[id],
    contacts: filteredContacts.filter((contact) => getQueueGroup(contact, now) === id),
  })), [filteredContacts, now]);

  const summary = getQueueSummary(contacts, filteredContacts, now);
  const firstAttention = getFirstAttentionContact(filteredContacts, now);

  function clearFilters() {
    onFiltersChange({ query: "", source: "all", status: "all" });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-9 pt-7 sm:px-6 sm:pt-9">
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Pracovní fronta</p>
            <h1 id="queue-heading" tabIndex={-1} className="dc-text-primary focus-ring mt-1 rounded-lg text-2xl font-bold tracking-[-0.035em] sm:text-[2rem]">Dnes / K řešení</h1>
            <p className="dc-text-muted mt-1.5 max-w-2xl text-sm leading-relaxed">Nejdřív vyřešte prošlé termíny a kontakty připravené k hovoru.</p>
          </div>
          <button type="button" onClick={onResetDemo} className="button-quiet ml-auto h-9 shrink-0 gap-1.5 px-2 text-xs"><RotateCcw className="size-3.5" aria-hidden="true" />Obnovit demo</button>
        </div>
      </div>

      <section className="queue-control-panel mb-5 grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(210px,1.1fr)_minmax(240px,1.3fr)_auto] lg:items-center" aria-label="Souhrn celé pracovní fronty">
        <div>
          <p className="queue-panel-eyebrow">Vyžaduje pozornost</p>
          <div className="mt-1 flex items-baseline gap-2"><strong className="queue-panel-count">{summary.attentionTotal}</strong><span className="queue-panel-caption">právě teď v celé frontě</span></div>
          {summary.attentionTotal === 0 ? <p className="queue-panel-muted mt-1 text-sm">Nic naléhavého. Naplánované úkoly zůstávají ve frontě.</p> : null}
        </div>
        <div className="queue-panel-breakdown flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {summary.overdueTotal > 0 ? <span className="inline-flex items-center gap-1.5"><AlertCircle className="queue-panel-overdue size-4 shrink-0" aria-hidden="true" /><strong>{formatCzechCount(summary.overdueTotal, ["prošlý termín", "prošlé termíny", "prošlých termínů"])}</strong></span> : null}
          {summary.readyNowTotal > 0 ? <span className="inline-flex items-center gap-1.5"><PhoneCall className="queue-panel-ready size-4 shrink-0" aria-hidden="true" /><strong>{formatCzechCount(summary.readyNowTotal, ["připravený hovor", "připravené hovory", "připravených hovorů"])}</strong></span> : null}
          {summary.todayRemainingTotal > 0 ? <span className="queue-panel-muted inline-flex items-center gap-1.5"><CalendarClock className="size-4 shrink-0" aria-hidden="true" />{formatCzechCount(summary.todayRemainingTotal, ["úkol", "úkoly", "úkolů"])} ještě dnes</span> : null}
          {filtersActive ? <p className="queue-panel-selection w-full">Ve výběru: {formatCzechCount(summary.selectionResults, ["výsledek", "výsledky", "výsledků"])} · {formatCzechCount(summary.selectionAttention, ["naléhavý úkol", "naléhavé úkoly", "naléhavých úkolů"])}</p> : null}
        </div>
        <div className="lg:justify-self-end">
          {firstAttention ? <button type="button" onClick={() => onOpenContact(firstAttention)} className="button-primary queue-panel-action w-full justify-between gap-4 pl-4 pr-1.5 lg:w-auto"><span>Otevřít první kontakt</span><span className="button-icon-slot" aria-hidden="true"><ArrowRight className="size-4" /></span></button>
            : filtersActive && summary.attentionTotal > 0 ? <button type="button" onClick={clearFilters} className="button-primary queue-panel-action w-full justify-between gap-4 pl-4 pr-1.5 lg:w-auto"><span>Zobrazit celou frontu</span><span className="button-icon-slot" aria-hidden="true"><ArrowRight className="size-4" /></span></button>
              : <button type="button" className="button-primary queue-panel-action w-full lg:w-auto" disabled>Nic naléhavého k otevření</button>}
          {filtersActive && !firstAttention && summary.attentionTotal > 0 ? <p className="queue-panel-muted mt-2 max-w-[250px] text-xs lg:text-right">Ve výběru není naléhavý kontakt.</p> : null}
        </div>
      </section>

      <div className="filter-controls mb-5 grid gap-3 sm:grid-cols-[minmax(240px,1fr)_180px_180px]">
        <label className="block">
          <span className="dc-text-muted mb-1.5 block text-xs font-semibold">Hledat kontakt</span>
          <span className="relative block">
            <Search className="dc-text-faint pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={filters.query} data-selected={Boolean(filters.query.trim())} onChange={(event) => onFiltersChange({ ...filters, query: event.target.value })} placeholder="Jméno, město, nemovitost…" className="field h-11 w-full pl-9 pr-3 text-sm" />
          </span>
        </label>
        <label>
          <span className="dc-text-muted mb-1.5 block text-xs font-semibold">Zdroj</span>
          <select value={filters.source} data-selected={filters.source !== "all"} onChange={(event) => onFiltersChange({ ...filters, source: event.target.value as QueueFilters["source"] })} className="field h-11 w-full px-3 text-sm">
            <option value="all">Všechny zdroje</option>
            {Object.entries(SOURCE_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>
          <span className="dc-text-muted mb-1.5 block text-xs font-semibold">Procesní stav</span>
          <select value={filters.status} data-selected={filters.status !== "all"} onChange={(event) => onFiltersChange({ ...filters, status: event.target.value as QueueFilters["status"] })} className="field h-11 w-full px-3 text-sm">
            <option value="all">Všechny stavy</option>
            {(["backlog", "to_call", "call_later", "meeting"] as ColumnId[]).map((value) => <option key={value} value={value}>{COLUMN_LABEL_CS[value]}</option>)}
          </select>
        </label>
      </div>

      <ActiveFilters filters={filters} onChange={onFiltersChange} />

      {filteredContacts.length === 0 ? (
        <div className="content-surface border-dashed px-5 py-14 text-center">
          {filtersActive ? <Inbox className="dc-text-faint mx-auto size-8" aria-hidden="true" /> : <CircleCheck className="dc-text-primary mx-auto size-8" aria-hidden="true" />}
          <h2 className="dc-text-primary mt-3 font-semibold">{filtersActive ? "Žádná shoda s aktivním výběrem" : "Ve frontě není žádná otevřená práce"}</h2>
          <p className="dc-text-muted mt-1 text-sm">{filtersActive ? "Zrušte některý filtr nebo se vraťte k celé frontě." : "Všechny aktivní kontakty jsou zpracované."}</p>
          {filtersActive && summary.attentionTotal === 0 ? <button type="button" onClick={clearFilters} className="button-secondary mt-5">Zobrazit celou frontu</button> : null}
        </div>
      ) : (
        <div className="space-y-7">
          {groups.filter((group) => group.contacts.length > 0).map((group) => (
            <section key={group.id} aria-labelledby={`group-${group.id}`}>
              <div className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                {group.id === "missed" ? <AlertCircle className="urgency-overdue-ink size-4 self-center" aria-hidden="true" /> : <CalendarClock className="dc-text-muted size-4 self-center" aria-hidden="true" />}
                <h2 id={`group-${group.id}`} className="dc-text-primary font-semibold">{group.title}</h2>
                <span className={`${group.id === "missed" ? "urgency-overdue-ink" : "dc-text-muted"} text-sm font-bold`}>{group.contacts.length}</span>
                <span className="dc-text-faint text-sm">· {group.description}</span>
              </div>
              <div className={`queue-list ${group.id === "missed" ? "queue-list-overdue" : ""}`}>
                {group.contacts.map((contact, index) => (
                  <QueueContactRow key={contact.id} contact={contact} now={now} selected={selectedId === contact.id} index={index} onOpen={() => onOpenContact(contact)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
