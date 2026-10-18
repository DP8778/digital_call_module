import type { Contact } from "./types";
import type { NewContactFilters } from "./uiState";

export function availableValues<K extends "city" | "subtype" | "source">(
  contacts: Contact[],
  field: K,
  selected: NewContactFilters[K],
): string[] {
  const values = new Set<string>(contacts.filter((contact) => contact.status === "backlog").map((contact) => contact[field]));
  if (selected !== "all") values.add(selected);
  return [...values].sort((a, b) => a.localeCompare(b, "cs"));
}
