"use client";

import { ArrowUpRight, ChevronDown, ChevronRight, Inbox, RotateCcw, Search, X } from "lucide-react";
import { useMemo } from "react";
import { SOURCE_LABEL, TYPE_LABEL } from "./labels";
import { availableValues } from "./newContactOptions";
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
  const cities = useMemo(() => availableValues(contacts, "city", filters.city), [contacts, filters.city]);
  const subtypes = useMemo(() => availableValues(contacts, "subtype", filters.subtype), [contacts, filters.subtype]);
  const sources = useMemo(() => availableValues(contacts, "source", filters.source), [contacts, filters.source]);
  const additionalCount = [filters.city, filters.type, filters.subtype, filters.source].filter((value) => value !== "all").length;
  const active = filters.query.trim() !== "" || filters.city !== "all" || filters.type !== "all" || filters.subtype !== "all" || filters.source !== "all";
  const set = (patch: Partial<NewContactFilters>) => onFiltersChange({ ...filters, ...patch });
  const chip = (label: string, patch: Partial<NewContactFilters>) => <button type="button" onClick={() => set(patch)} className="active-filter focus-ring inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">{label}<X className="size-3" aria-hidden="true" /></button>;

  function extraFilters() {
    return <>
      <label className="new-filter-control" data-active={filters.city !== "all"}><span className="carbon-muted mb-1.5 block text-xs font-semibold">Lokalita</span><select value={filters.city} onChange={(event) => set({ city: event.target.value })} className="field new-filter-field h-11 w-full px-3 text-sm"><option value="all">Všechny lokality</option>{cities.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
      <label className="new-filter-control" data-active={filters.type !== "all"}><span className="carbon-muted mb-1.5 block text-xs font-semibold">Nabídka</span><select value={filters.type} onChange={(event) => set({ type: event.target.value as NewContactFilters["type"] })} className="field new-filter-field h-11 w-full px-3 text-sm"><option value="all">Prodej i pronájem</option><option value="prodej">Prodej</option><option value="pronajem">Pronájem</option></select></label>
      <label className="new-filter-control" data-active={filters.subtype !== "all"}><span className="carbon-muted mb-1.5 block text-xs font-semibold">Nemovitost</span><select value={filters.subtype} onChange={(event) => set({ subtype: event.target.value })} className="field new-filter-field h-11 w-full px-3 text-sm"><option value="all">Všechny typy</option>{subtypes.map((subtype) => <option key={subtype} value={subtype}>{subtype}</option>)}</select></label>
      <label className="new-filter-control" data-active={filters.source !== "all"}><span className="carbon-muted mb-1.5 block text-xs font-semibold">Zdroj</span><select value={filters.source} onChange={(event) => set({ source: event.target.value as NewContactFilters["source"] })} className="field new-filter-field h-11 w-full px-3 text-sm"><option value="all">Všechny zdroje</option>{sources.map((source) => <option key={source} value={source}>{SOURCE_LABEL[source as Contact["source"]]}</option>)}</select></label>
    </>;
  }

  return <div className="mx-auto w-full max-w-7xl px-4 pb-9 pt-4 sm:px-6 sm:pt-9">
    <div className="mb-3 sm:mb-6"><p className="eyebrow">Zásobník</p><div className="mt-1 flex items-center justify-between gap-2"><h1 id="new-contacts-heading" tabIndex={-1} className="dc-text-primary focus-ring min-w-0 rounded-lg text-2xl font-bold tracking-[-0.035em] sm:text-[2rem]">Nové kontakty</h1><button type="button" onClick={onResetDemo} aria-label="Obnovit demo" title="Obnovit demo" className="button-quiet size-11 shrink-0 px-0 sm:ml-auto sm:w-auto sm:gap-1.5 sm:px-2 sm:text-xs"><RotateCcw className="size-4" aria-hidden="true" /><span className="hidden sm:inline">Obnovit demo</span></button></div><p className="dc-text-muted mt-1 text-sm leading-relaxed sm:mt-1.5">Vyberte příležitosti, které chcete začít zpracovávat.</p></div>

    <section aria-label="Výběr nových kontaktů" className="new-filter-panel carbon-surface mb-3 p-3 sm:mb-5 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[minmax(240px,1.5fr)_minmax(0,2.5fr)] lg:items-end">
        <label className="new-filter-control" data-active={Boolean(filters.query.trim())}><span className="carbon-muted mb-1.5 block text-xs font-semibold">Hledat příležitost</span><span className="relative block"><Search className="dc-text-faint pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" aria-hidden="true" /><input type="search" value={filters.query} onChange={(event) => set({ query: event.target.value })} placeholder="Nemovitost, lokalita, jméno…" className="field new-filter-field h-11 w-full pl-9 pr-3 text-sm" /></span></label>
        <div className="hidden grid-cols-2 gap-3 sm:grid xl:grid-cols-4">{extraFilters()}</div>
      </div>
      <details className="new-mobile-filters mt-2 sm:hidden"><summary className="carbon-link focus-ring flex min-h-10 cursor-pointer items-center gap-2 rounded-lg text-sm font-semibold">Další filtry{additionalCount ? <span className="carbon-count rounded-lg px-2 py-0.5 text-xs text-white">{additionalCount} aktivní</span> : null}<ChevronDown className="size-4" aria-hidden="true" /></summary><div className="mt-2 grid grid-cols-2 gap-3">{extraFilters()}</div></details>
    </section>
    {active ? <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Aktivní filtry nových kontaktů"><span className="dc-text-muted mr-1 text-xs font-semibold uppercase tracking-wide">Výběr</span>{filters.query.trim() && chip(`„${filters.query.trim()}“`, { query: "" })}{filters.city !== "all" && chip(filters.city, { city: "all" })}{filters.type !== "all" && chip(TYPE_LABEL[filters.type], { type: "all" })}{filters.subtype !== "all" && chip(filters.subtype, { subtype: "all" })}{filters.source !== "all" && chip(SOURCE_LABEL[filters.source], { source: "all" })}<button type="button" onClick={() => onFiltersChange({ ...DEFAULT_NEW_CONTACT_FILTERS, sort: filters.sort })} className="button-quiet h-8 px-2 text-xs">Zrušit vše</button></div> : null}

    <div className="new-results-bar mb-2 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 rounded-xl px-2.5 py-1.5 sm:mb-3 sm:px-3 sm:py-2"><p className="dc-text-muted shrink-0 text-sm" role="status">{active ? <><strong className="dc-text-primary">{matches.length}</strong> z {backlog.length} kontaktů</> : <strong className="dc-text-primary">{backlog.length} {backlog.length === 1 ? "kontakt" : backlog.length >= 2 && backlog.length <= 4 ? "kontakty" : "kontaktů"}</strong>}</p><label className="flex min-w-0 items-center gap-1 text-sm sm:gap-2"><span className="dc-text-muted hidden font-medium sm:inline">Řadit</span><select value={filters.sort} onChange={(event) => set({ sort: event.target.value as NewContactFilters["sort"] })} aria-label="Řadit nové kontakty" className="field h-10 max-w-full px-2 text-sm sm:px-3"><option value="newest">Nejnovější</option><option value="oldest">Nejstarší</option></select></label></div>
    {matches.length ? <div className="new-contact-list"><div className="new-list-heading hidden px-4 py-2 text-xs font-bold uppercase tracking-wide lg:grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(155px,.9fr)_128px] lg:gap-4"><span>Nemovitost · lokalita</span><span>Nabídka · kontakt</span><span>Zdroj · přidáno</span><span className="text-right">Podrobnosti</span></div>{matches.map((contact) => <button key={contact.id} id={`new-contact-${contact.id}`} type="button" data-selected={selectedId === contact.id} onClick={() => onOpenContact(contact)} className="new-contact-row contact-row focus-ring group grid w-full gap-2 rounded-xl p-4 text-left lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(155px,.9fr)_128px] lg:items-center lg:gap-4"><span className="min-w-0"><span className="dc-text-primary block text-base font-bold leading-tight">{contact.subtype}</span><span className="dc-text-muted mt-1 block text-sm">{contact.city}</span></span><span className="min-w-0"><span className="dc-text-primary block text-sm font-semibold">{TYPE_LABEL[contact.type]}</span><span className="dc-text-muted mt-1 block text-sm">{contact.name}</span></span><span className="dc-text-muted text-sm"><span className="block">{SOURCE_LABEL[contact.source]}</span><span className="dc-text-faint mt-1 block text-xs">{formatPragueDateTime(contact.createdAt)}</span></span><span className="new-row-open inline-flex items-center justify-center gap-1.5 justify-self-start whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold lg:justify-self-end">Prohlédnout<ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></span></button>)}</div>
      : <div className="content-surface border-dashed px-5 py-14 text-center"><Inbox className="dc-text-faint mx-auto size-8" aria-hidden="true" /><h2 className="dc-text-primary mt-3 font-semibold">{backlog.length ? "Žádná shoda s výběrem" : justStarted ? "Poslední kontakt byl zařazen do zpracování" : "Zásobník je prázdný"}</h2><p className="dc-text-muted mt-1 text-sm">{backlog.length ? "Zkuste upravit nebo zrušit filtry." : "Další práci najdete v pohledu K řešení a v Procesu."}</p>{backlog.length ? <button type="button" onClick={() => onFiltersChange({ ...DEFAULT_NEW_CONTACT_FILTERS, sort: filters.sort })} className="button-secondary mt-5">Zrušit filtry</button> : <button type="button" onClick={onGoToQueue} className="button-secondary mt-5">Přejít do K řešení <ArrowUpRight className="size-4" aria-hidden="true" /></button>}</div>}
  </div>;
}
