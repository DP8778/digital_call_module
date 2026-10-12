export const PRAGUE_TIME_ZONE = "Europe/Prague";

const dateTimeFormatter = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: PRAGUE_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: PRAGUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function partsAt(timestamp: number) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: PRAGUE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(timestamp);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function offsetAt(timestamp: number): number {
  const p = partsAt(timestamp);
  const asUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  return asUtc - Math.floor(timestamp / 1000) * 1000;
}

export function parsePragueDateTime(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match;
  const wallClockUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
  let result = wallClockUtc - offsetAt(wallClockUtc);
  result = wallClockUtc - offsetAt(result);
  return toPragueDateTimeInput(result) === value ? result : null;
}

export function toPragueDateTimeInput(timestamp: number): string {
  const p = partsAt(timestamp);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function formatPragueDateTime(timestamp: number): string {
  return dateTimeFormatter.format(timestamp).replace(",", " ·");
}

export function formatPragueTime(timestamp: number): string {
  return new Intl.DateTimeFormat("cs-CZ", {
    timeZone: PRAGUE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

export function pragueDayKey(timestamp: number): string {
  return dayFormatter.format(timestamp);
}

export function pragueDayStart(timestamp: number): number {
  const parsed = parsePragueDateTime(`${pragueDayKey(timestamp)}T00:00`);
  if (parsed === null) throw new Error("Nepodařilo se určit začátek pražského dne.");
  return parsed;
}

export function addPragueCalendarDays(timestamp: number, days: number, hour = 9): number {
  const [year, month, day] = pragueDayKey(timestamp).split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  const date = `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}-${String(shifted.getUTCDate()).padStart(2, "0")}`;
  const result = parsePragueDateTime(`${date}T${String(hour).padStart(2, "0")}:00`);
  if (result === null) throw new Error("Nepodařilo se vytvořit pražský termín.");
  return result;
}

export function relativeDayLabel(timestamp: number, now: number): string {
  const key = pragueDayKey(timestamp);
  if (key === pragueDayKey(now)) return `Dnes v ${formatPragueTime(timestamp)}`;
  if (key === pragueDayKey(addPragueCalendarDays(now, 1))) return `Zítra v ${formatPragueTime(timestamp)}`;
  if (key === pragueDayKey(addPragueCalendarDays(now, -1))) return `Včera v ${formatPragueTime(timestamp)}`;
  return formatPragueDateTime(timestamp);
}
