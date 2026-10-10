import { SealKind } from '../../shared/ui/geo-seal/geo-seal';
import { ReservationStatus } from '../domain/model/reservation';

/** Query param the offer detail adds after reserving: "new" (201) or "existing" (200). */
export const PLACED_PARAM = 'placed';

/** Seal of each status (Figma "Sello"); the label comes from reservation.status.<STATUS>. */
export const STATUS_SEAL: Record<ReservationStatus, SealKind> = {
  ACTIVE: 'active',
  REDEEMED: 'verified',
  EXPIRED: 'expired',
  REPORTED: 'reported',
};

const LIMA_TIME_ZONE = 'America/Lima';
const LIMA_DATE_TIME = new Intl.DateTimeFormat('es-PE', {
  timeZone: LIMA_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
});

/**
 * Instant of the service (UTC) as the consumer reads it in Lima, e.g. "14 oct, 11:59 p. m.".
 * The offer ends at the last second of its day in Lima, which is already the next day in UTC.
 */
export function limaDateTime(instant: string): string {
  return LIMA_DATE_TIME.format(new Date(instant));
}

const MILLIS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
/** Beyond two days the countdown reads in days, e.g. "60 días". */
const HOURS_SHOWN_AS_DAYS = 48;

/** "3 h 20 min", "45 min" or "12 días" until the reservation expires; null once it passed. */
export function remainingTime(expiresAt: string, now: number): string | null {
  const minutes = Math.floor((new Date(expiresAt).getTime() - now) / MILLIS_PER_MINUTE);
  if (minutes <= 0) {
    return null;
  }
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  if (hours >= HOURS_SHOWN_AS_DAYS) {
    return `${Math.floor(hours / HOURS_PER_DAY)} días`;
  }
  return hours > 0 ? `${hours} h ${minutes % MINUTES_PER_HOUR} min` : `${minutes} min`;
}
