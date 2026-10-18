"use client";

import { ChevronRight, Inbox, RotateCcw, Search, X } from "lucide-react";
import { useMemo } from "react";
import { SOURCE_LABEL, TYPE_LABEL } from "./labels";
import { filterNewContacts, getNewContacts } from "./newContactsLogic";
import { formatPragueDateTime } from "./time";
import { DEFAULT_NEW_CONTACT_FILTERS, type NewContactFilters } from "./uiState";
import type { Contact } from "./types";

type Props = {
  contacts: Contact[];
  filters: NewContactFilters;
  selectedId: string | null;
  onFiltersChange: (filters: NewContactFilters) => void;
  onOpenContact: (contact: Contact) => void;
  onResetDemo: () => void;
  onGoToQueue: () => void;
  justStarted: boolean;
};

export default function NewContactsView({ contacts, filters, selectedId, onFiltersChange, onOpenContact, onResetDemo, onGoToQueue, justStarted }: Props) {
  const backlog = useMemo(() => getNewContacts(contacts), [contacts]);
  const matches = useMemo(() => filterNewContacts(contacts, filters), [contacts, filters]);
  const cities = useMemo(() => [...new Set(backlog.map((contact) => contact.city))].sort((a, b) => a.localeCompare(b, "cs")), [backlog]);
  const subtypes = useMemo(() => [...new Set(backlog.map((contact) => contact.subtype))].sort((a, b) => a.localeCompare(b, "cs")), [backlog]);
  const sources = useMemo(() => [...new Set(backlog.map((contact) => contact.source))], [backlog]);
  const active = filters.query.trim() !== "" || filters.city !== "all" || filters.type !== "all" || filters.subtype !== "all" || filters.source !== "all";
  const chosenCity = cities.includes(filters.city) ? filters.city : "all";
  const chosenSubtype = subtypes.includes(filters.subtype) ? filters.subtype : "all";
  const chosenSource = filters.source === "all" || sources.includes(filters.source) ? filters.source : "all";
  const set = (patch: Partial<NewContactFilters>) => onFiltersChange({ ...filters, ...patch });
  const chip = (label: string, patch: Partial<NewContactFilters>) => <button type="button" onClick={() => set(patch)} className="active-filter focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">{label}<X className="size-3" aria-hidden="true" /></button>;

  return <div className="mx-auto w-full max-w-7xl px-4 pb-9 pt-7 sm:px-6 sm:pt-9">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3"><div><p className="eyebrow">Zásobník</p><h1 id="new-contacts-heading" tabIndex={-1} className="dc-text-primary focus-ring mt-1 rounded-lg text-2xl font-bold tracking-[-0.035em] sm:text-[2rem]">Nové kontakty</h1><p className="dc-text-muted mt-1.5 text-sm leading-relaxed">Vyberte příležitosti, které chcete začít zpracovávat.</p></div><button type="button" onClick={onResetDemo} className="button-quiet ml-auto h-9 shrink-0 gap-1.5 px-2 text-xs"><RotateCcw className="size-3.5" aria-hidden="true" />Obnovit demo</button></div>

    <section aria-label="Výběr nových kontaktů" className="filter-controls mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,2fr)_repeat(4,minmax(120px,1fr))]">
      <label className="block"><span className="dc-text-muted mb-1.5 block text-xs font-semibold">Hledat</span><span className="relative block"><Search className="dc-text-faint pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" /><input type="search" value={filters.query} onChange={(event) => set({ query: event.target.value })} placeholder="Jméno, lokalita, nemovitost…" className="field h-11 w-full pl-9 pr-3 text-sm" /></span></label>
      <label><span className="dc-text-muted mb-1.5 block text-xs font-semibold">Lokalita</span><select value={chosenCity} onChange={(event) => set({ city: event.target.value })} className="field h-11 w-full px-3 text-sm"><option value="all">Všechny lokality</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
      <label><span className="dc-text-muted mb-1.5 block text-xs font-semibold">Nabídka</span><select value={filters.type} onChange={(event) => set({ type: event.target.value as NewContactFilters["type"] })} className="field h-11 w-full px-3 text-sm"><option value="all">Prodej i pronájem</option><option value="prodej">Prodej</option><option value="pronajem">Pronájem</option></select></label>
      <label><span className="dc-text-muted mb-1.5 block text-xs font-semibold">Nemovitost</span><select value={chosenSubtype} onChange={(event) => set({ subtype: event.target.value })} className="field h-11 w-full px-3 text-sm"><option value="all">Všechny typy</option>{subtypes.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}</select></label>
      <label><span className="dc-text-muted mb-1.5 block text-xs font-semibold">Zdroj</span><select value={chosenSource} onChange={(event) => set({ source: event.target.value as NewContactFilters["source"] })} className="field h-11 w-full px-3 text-sm"><option value="all">Všechny zdroje</option>{sources.map((source) => <option key={source} value={source}>{SOURCE_LABEL[source]}</option>)}</select></label>
    </section>
    {active ? <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Aktivní filtry nových kontaktů"><span className="dc-text-muted mr-1 text-xs font-semibold uppercase tracking-wide">Výběr</span>{filters.query.trim() && chip(`„${filters.query.trim()}“`, { query: "" })}{filters.city !== "all" && chip(filters.city, { city: "all" })}{filters.type !== "all" && chip(TYPE_LABEL[filters.type], { type: "all" })}{filters.subtype !== "all" && chip(filters.subtype, { subtype: "all" })}{filters.source !== "all" && chip(SOURCE_LABEL[filters.source], { source: "all" })}<button type="button" onClick={() => onFiltersChange({ ...DEFAULT_NEW_CONTACT_FILTERS, sort: filters.sort })} className="button-quiet h-8 px-2 text-xs">Zrušit vše</button></div> : null}

    <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><p className="dc-text-muted text-sm" role="status"><strong className="dc-text-primary">{matches.length}</strong> z {backlog.length} kontaktů v zásobníku</p><label className="flex items-center gap-2 text-sm"><span className="dc-text-muted font-medium">Řadit</span><select value={filters.sort} onChange={(event) => set({ sort: event.target.value as NewContactFilters["sort"] })} className="field h-10 px-3 text-sm"><option value="newest">Od nejnovějších</option><option value="oldest">Od nejstarších</option></select></label></div>
    {matches.length ? <div className="queue-list">{matches.map((contact, index) => <button key={contact.id} id={`new-contact-${contact.id}`} type="button" data-selected={selectedId === contact.id} onClick={() => onOpenContact(contact)} className={`contact-row focus-ring group grid w-full gap-2 px-4 py-3 text-left transition-colors hover:bg-[var(--dc-hover)] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(130px,.9fr)_28px] sm:items-center sm:gap-4 ${index ? "border-t border-[var(--dc-border)]" : ""}`}><span className="min-w-0"><span className="dc-text-primary block truncate font-semibold">{contact.name}</span></span><span className="min-w-0"><span className="dc-text-primary block truncate text-sm font-semibold">{contact.subtype} · {contact.city}</span><span className="dc-text-muted mt-0.5 block text-sm">{TYPE_LABEL[contact.type]}</span></span><span className="dc-text-muted text-sm sm:text-right"><span className="block">{SOURCE_LABEL[contact.source]}</span><span className="dc-text-faint mt-0.5 block">Přidáno {formatPragueDateTime(contact.createdAt)}</span></span><ChevronRight className="dc-text-muted hidden size-4 sm:block" aria-hidden="true" /></button>)}</div>
      : <div className="content-surface border-dashed px-5 py-14 text-center"><Inbox className="dc-text-faint mx-auto size-8" aria-hidden="true" /><h2 className="dc-text-primary mt-3 font-semibold">{backlog.length ? "Žádná shoda s výběrem" : justStarted ? "Poslední kontakt byl zařazen do zpracování" : "Zásobník je prázdný"}</h2><p className="dc-text-muted mt-1 text-sm">{backlog.length ? "Zkuste upravit nebo zrušit filtry." : "Další práci najdete v pohledu K řešení a v Procesu."}</p>{backlog.length ? <button type="button" onClick={() => onFiltersChange({ ...DEFAULT_NEW_CONTACT_FILTERS, sort: filters.sort })} className="button-secondary mt-5">Zrušit filtry</button> : <button type="button" onClick={onGoToQueue} className="button-secondary mt-5">Přejít do K řešení</button>}</div>}
  </div>;
}
