const DATE = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/Bogota',
});
const DATE_TIME = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Bogota',
});

/** «2026-10-19T15:04:00Z» → «19 oct 2026» (hora de Colombia). */
export function formatDate(iso: string | null): string {
  return iso ? DATE.format(new Date(iso)) : '—';
}

/** «2026-10-19T15:04:00Z» → «19 oct 2026, 10:04 a. m.». */
export function formatDateTime(iso: string | null): string {
  return iso ? DATE_TIME.format(new Date(iso)) : '—';
}
