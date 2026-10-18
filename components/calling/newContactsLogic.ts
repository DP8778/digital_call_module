import type { Contact } from "./types";
import type { NewContactFilters } from "./uiState";

export function getNewContacts(contacts: Contact[]): Contact[] {
  return contacts.filter((contact) => contact.status === "backlog");
}

export function filterNewContacts(contacts: Contact[], filters: NewContactFilters): Contact[] {
  const query = filters.query.trim().toLocaleLowerCase("cs");
  return getNewContacts(contacts)
    .filter((contact) => filters.city === "all" || contact.city === filters.city)
    .filter((contact) => filters.type === "all" || contact.type === filters.type)
    .filter((contact) => filters.subtype === "all" || contact.subtype === filters.subtype)
    .filter((contact) => filters.source === "all" || contact.source === filters.source)
    .filter((contact) => !query || [contact.name, contact.city, contact.subtype].join(" ").toLocaleLowerCase("cs").includes(query))
    .sort((a, b) => (filters.sort === "newest" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt) || a.name.localeCompare(b.name, "cs"));
}
