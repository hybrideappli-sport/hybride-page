const TIMEZONE = "Europe/Paris";

export function formatEventDay(iso: string): number {
  return Number(new Intl.DateTimeFormat("fr-FR", { day: "numeric", timeZone: TIMEZONE }).format(new Date(iso)));
}

export function formatEventMonth(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: TIMEZONE }).format(new Date(iso));
}

export function formatEventDateLong(iso: string): string {
  const formatted = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: TIMEZONE }).format(
    new Date(iso),
  );
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TIMEZONE }).format(new Date(iso));
}
