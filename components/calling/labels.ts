import type { ActivityType, Contact, ContactSource } from "./types";

export const SOURCE_LABEL: Record<ContactSource, string> = {
  inzerce: "Inzerce",
  tipar: "Tipař",
  fb: "FB kampaň",
  callcentrum: "Call centrum",
};

export const TYPE_LABEL: Record<Contact["type"], string> = {
  prodej: "Prodej",
  pronajem: "Pronájem",
};

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  call: "Hovor",
  meeting: "Schůzka",
};
