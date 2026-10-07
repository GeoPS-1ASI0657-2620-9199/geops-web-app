/** Same values as the ReservationStatus enum of reservation-service. */
export const RESERVATION_STATUSES = ['ACTIVE', 'REDEEMED', 'EXPIRED', 'REPORTED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Same rule as ReservationCode in reservation-service: 8 characters without 0, O, 1, I or L. */
export const RESERVATION_CODE_LENGTH = 8;
export const RESERVATION_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** A reservation of an offer that is paid at the business (US40). Instants are ISO 8601 in UTC. */
export interface Reservation {
  readonly reservationId: number;
  readonly code: string;
  readonly consumerId: number;
  readonly offerId: number;
  readonly businessId: number;
  readonly offerTitle: string;
  readonly status: ReservationStatus;
  readonly reservedAt: string;
  readonly expiresAt: string;
  readonly redeemedAt: string | null;
}

/**
 * Answer to a reservation request. isNew is false when the consumer already had an active
 * reservation of the offer and the service returned that one instead of creating another.
 */
export interface PlacedReservation {
  readonly reservationId: number;
  readonly code: string;
  readonly expiresAt: string;
  readonly isNew: boolean;
}

export function isReservationStatus(value: string | null | undefined): value is ReservationStatus {
  return RESERVATION_STATUSES.includes(value as ReservationStatus);
}

export function isWellFormedCode(code: string): boolean {
  return (
    code.length === RESERVATION_CODE_LENGTH &&
    [...code].every((character) => RESERVATION_CODE_ALPHABET.includes(character))
  );
}

export function isPositiveId(id: number): boolean {
  return Number.isInteger(id) && id > 0;
}
