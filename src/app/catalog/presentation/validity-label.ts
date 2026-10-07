const MILLIS_PER_DAY = 86_400_000;
const DAY_MONTH = new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', timeZone: 'UTC' });

/**
 * Validity always visible on the card (Figma rule): "Vence hoy", "Vence mañana" or "Vence el 15 de
 * octubre". validTo is the last valid day (yyyy-mm-dd); today is compared as a calendar day.
 */
export function validityLabel(validTo: string, today: Date = new Date()): string {
  const [year, month, day] = validTo.split('-').map(Number);
  const last = Date.UTC(year, month - 1, day);
  const current = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.round((last - current) / MILLIS_PER_DAY);
  if (days === 0) {
    return 'Vence hoy';
  }
  if (days === 1) {
    return 'Vence mañana';
  }
  return `Vence el ${DAY_MONTH.format(new Date(last))}`;
}
