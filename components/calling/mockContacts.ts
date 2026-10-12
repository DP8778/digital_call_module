import { DEMO_SCHEMA_VERSION } from "./demoConstants";
import { addPragueCalendarDays, pragueDayStart } from "./time";
import type { Contact, ContactSource, DemoState, TimelineEntry } from "./types";

type Seed = Pick<
  Contact,
  "id" | "name" | "type" | "subtype" | "city" | "source" | "status"
> & {
  activity?: { type: "call" | "meeting"; day: number; hour: number };
  previousAttempt?: { daysAgo: number; label: string; note: string };
};

const SEEDS: Seed[] = [
  { id: "demo-1", name: "Anna Novotná", type: "prodej", subtype: "Byt 3+kk", city: "Praha 7", source: "fb", status: "to_call", activity: { type: "call", day: -1, hour: 16 }, previousAttempt: { daysAgo: 3, label: "Nedovoláno", note: "Preferuje kontakt po 15. hodině." } },
  { id: "demo-2", name: "Petr Dvořák", type: "prodej", subtype: "Rodinný dům", city: "Beroun", source: "inzerce", status: "call_later", activity: { type: "call", day: 0, hour: 14 }, previousAttempt: { daysAgo: 2, label: "Ozvat se později", note: "Potřebuje nejdřív doplnit podklady." } },
  { id: "demo-3", name: "Lucie Jelínková", type: "pronajem", subtype: "Byt 2+kk", city: "Praha 10", source: "callcentrum", status: "meeting", activity: { type: "meeting", day: 0, hour: 17 }, previousAttempt: { daysAgo: 4, label: "Domluvena schůzka", note: "Schůzka na místě u nemovitosti." } },
  { id: "demo-4", name: "Marek Černý", type: "prodej", subtype: "Pozemek", city: "Kladno", source: "tipar", status: "to_call", activity: { type: "call", day: 0, hour: 10 } },
  { id: "demo-5", name: "Eva Králová", type: "prodej", subtype: "Byt 4+kk", city: "Plzeň", source: "inzerce", status: "meeting", activity: { type: "meeting", day: -1, hour: 11 }, previousAttempt: { daysAgo: 5, label: "Domluvena schůzka", note: "Po schůzce potvrdit další postup." } },
  { id: "demo-6", name: "Tomáš Urban", type: "pronajem", subtype: "Komerční prostor", city: "Brno", source: "fb", status: "call_later", activity: { type: "call", day: 1, hour: 9 }, previousAttempt: { daysAgo: 1, label: "Ozvat se později", note: "Dopoledne má více času." } },
  { id: "demo-7", name: "Jana Benešová", type: "prodej", subtype: "Rodinný dům", city: "Pardubice", source: "callcentrum", status: "backlog" },
  { id: "demo-8", name: "Michal Horák", type: "prodej", subtype: "Byt 1+1", city: "Olomouc", source: "inzerce", status: "backlog" },
  { id: "demo-9", name: "Klára Veselá", type: "pronajem", subtype: "Ateliér", city: "Praha 3", source: "tipar", status: "listed", previousAttempt: { daysAgo: 8, label: "Domluvena schůzka", note: "Ukázkový dokončený případ." } },
  { id: "demo-10", name: "Radek Kučera", type: "prodej", subtype: "Rekreační chata", city: "Jihlava", source: "fb", status: "disqualified", previousAttempt: { daysAgo: 6, label: "Kontakt vyřazen", note: "O službu nyní nemá zájem." } },
  { id: "demo-11", name: "Alena Fialová", type: "prodej", subtype: "Byt 2+1", city: "Liberec", source: "tipar", status: "call_later", activity: { type: "call", day: -1, hour: 9 }, previousAttempt: { daysAgo: 2, label: "Nedovoláno", note: "Druhý pokus naplánován na ráno." } },
  { id: "demo-12", name: "David Soukup", type: "pronajem", subtype: "Byt 3+kk", city: "Hradec Králové", source: "callcentrum", status: "meeting", activity: { type: "meeting", day: 3, hour: 13 }, previousAttempt: { daysAgo: 1, label: "Domluvena schůzka", note: "Online konzultace." } },
];

const SOURCE_INDEX: Record<ContactSource, number> = {
  inzerce: 1,
  tipar: 2,
  fb: 3,
  callcentrum: 4,
};

export function createDemoState(now: number): DemoState {
  const today = pragueDayStart(now);
  const contacts = SEEDS.map((seed, index): Contact => {
    const createdAt = addPragueCalendarDays(today, -(14 + index), 9 + (index % 7));
    const history: TimelineEntry[] = [];
    if (seed.previousAttempt) {
      const at = addPragueCalendarDays(today, -seed.previousAttempt.daysAgo, 15);
      history.push({
        id: `${seed.id}-seed-attempt`,
        at,
        type: "call_attempt",
        label: seed.previousAttempt.label,
        note: seed.previousAttempt.note,
      });
    }
    history.push({
      id: `${seed.id}-created`,
      at: createdAt,
      type: "created",
      label: "Kontakt přidán do dema",
    });
    const dueAt = seed.activity
      ? addPragueCalendarDays(today, seed.activity.day, seed.activity.hour)
      : null;
    return {
      id: seed.id,
      name: seed.name,
      phone: `+420 ••• ••• ${String(100 + index).slice(-3)}`,
      email: `demo.${index + 1}@example.invalid`,
      type: seed.type,
      subtype: seed.subtype,
      city: seed.city,
      source: seed.source,
      status: seed.status,
      createdAt,
      statusUpdatedAt: history[0].at,
      nextActivity: dueAt
        ? { id: `${seed.id}-activity-${SOURCE_INDEX[seed.source]}`, type: seed.activity!.type, dueAt }
        : null,
      history,
    };
  });
  return { schemaVersion: DEMO_SCHEMA_VERSION, updatedAt: now, contacts };
}
