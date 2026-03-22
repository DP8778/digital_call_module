import type { Contact } from "./types";

const FIRST_NAMES = [
  "Jan",
  "Petra",
  "Martin",
  "Lucie",
  "Tomáš",
  "Pavel",
  "Alena",
  "Milan",
  "Veronika",
  "Radek",
  "Jana",
  "Jiří",
  "Eva",
  "Lukáš",
  "Kateřina",
  "David",
  "Tereza",
  "Michal",
  "Lenka",
  "Ondřej",
  "Hana",
  "Filip",
  "Markéta",
  "Jakub",
  "Zdeňka",
  "Vojtěch",
  "Simona",
  "Karel",
  "Barbora",
  "Roman",
  "Klára",
  "Adam",
  "Ivana",
  "Daniel",
  "Michaela",
  "Patrik",
  "Monika",
  "Stanislav",
  "Renata",
  "Václav",
  "Martina",
  "Luboš",
  "Pavla",
  "Eduard",
  "Vlasta",
  "Jaroslav",
  "Andrea",
  "Bohumil",
  "Šárka",
  "Eliška",
  "Kristýna",
] as const;

const LAST_NAMES = [
  "Novák",
  "Svobodová",
  "Dvořák",
  "Králová",
  "Černý",
  "Marek",
  "Němcová",
  "Horák",
  "Jelínková",
  "Procházka",
  "Beneš",
  "Kučera",
  "Veselý",
  "Hrušková",
  "Fiala",
  "Krejčí",
  "Urban",
  "Bláhová",
  "Pospíšil",
  "Holub",
  "Doležal",
  "Soukup",
  "Čech",
  "Sedláček",
  "Šimek",
  "Pavlík",
  "Bartoš",
  "Růžička",
  "Machová",
  "Havlíček",
  "Řehák",
  "Kopecký",
  "Polák",
  "Němeček",
  "Šťastná",
  "Vaněk",
  "Čermáková",
  "Bílek",
  "Kovář",
  "Tůma",
  "Wagner",
  "Moravec",
  "Babinský",
  "Zelenková",
  "Klíma",
  "Vychodil",
  "Novotný",
  "Kadlec",
  "Langerová",
  "Filipi",
  "Pokorný",
] as const;

const SUBTYPES = [
  "Rodinný dům",
  "Byt 2+kk",
  "Byt 3+kk",
  "Byt 1+1",
  "Pozemek",
  "Garsonka",
  "Vila",
  "Ateliér",
  "Komerční prostory",
  "Chatka",
  "Investiční byt",
  "Rodinný dům s pozemkem",
  "Byt 4+kk",
  "Dům 5+1",
  "Rekreační chata",
] as const;

const CITIES = [
  "Praha",
  "Brno",
  "Ostrava",
  "Plzeň",
  "Olomouc",
  "České Budějovice",
  "Hradec Králové",
  "Zlín",
  "Liberec",
  "Pardubice",
  "Jihlava",
  "Karlovy Vary",
  "Ústí nad Labem",
  "Česká Lípa",
  "Mladá Boleslav",
  "Opava",
  "Frýdek-Místek",
  "Teplice",
  "Kladno",
  "Most",
] as const;

const SOURCES: Contact["source"][] = ["inzerce", "tipar", "fb", "callcentrum"];

const BASE_DATE_MS = new Date("2025-01-06T07:00:00").getTime();

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatCreatedAt(ms: number): string {
  const d = new Date(ms);
  const Y = d.getFullYear();
  const M = pad2(d.getMonth() + 1);
  const D = pad2(d.getDate());
  const h = pad2(d.getHours());
  const m = pad2(d.getMinutes());
  return `${Y}-${M}-${D} ${h}:${m}`;
}

function timeFromMs(ms: number): string {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function buildContact(index1: number): Contact {
  const i = index1 - 1;
  const offsetMin = i * 47 + (i % 13) * 12;
  const createdMs = BASE_DATE_MS + offsetMin * 60 * 1000;
  const createdAt = formatCreatedAt(createdMs);
  const time = timeFromMs(createdMs);

  const fn = FIRST_NAMES[i % FIRST_NAMES.length];
  const ln = LAST_NAMES[(i * 7) % LAST_NAMES.length];
  const p2 = 100 + ((i * 47) % 900);
  const p3 = 100 + ((i * 89) % 900);
  const prefix = 720 + (i % 79);

  return {
    id: `c-${index1}`,
    name: `${fn} ${ln}`,
    phone: `+420 ${prefix} ${String(p2).padStart(3, "0")} ${String(p3).padStart(3, "0")}`,
    email: `kontakt.${index1}@example.cz`,
    type: i % 2 === 0 ? "prodej" : "pronajem",
    subtype: SUBTYPES[i % SUBTYPES.length],
    city: CITIES[i % CITIES.length],
    source: SOURCES[i % SOURCES.length],
    time,
    createdAt,
  };
}

/** Všech 50 kontaktů (plochý seznam). Počáteční rozložení boardu řeší `useCallingBoardState`. */
export const MOCK_CONTACTS_ALL: Contact[] = Array.from({ length: 50 }, (_, k) =>
  buildContact(k + 1),
);
