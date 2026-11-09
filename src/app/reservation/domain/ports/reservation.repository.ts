import { PlacedReservation, RedeemedReservation, Reservation, ReservationStatus } from '../model/reservation';

/**
 * Port to reservation-service. The consumer comes from the token the interceptor adds.
 * Implementations reject with ApiError.
 */
export abstract class ReservationRepository {
  abstract reserve(offerId: number): Promise<PlacedReservation>;
  abstract findById(reservationId: number): Promise<Reservation>;
  /** A reservation of the owner's business by its code, to validate it at the counter (US41). */
  abstract findByCode(code: string): Promise<Reservation>;
  /**
   * Marks the delivery of a code of the owner's business (US41). Rejects with RESERVATION_NOT_FOUND,
   * FORBIDDEN, RESERVATION_ALREADY_REDEEMED (with redeemedAt), RESERVATION_REPORTED or RESERVATION_EXPIRED.
   */
  abstract redeem(code: string): Promise<RedeemedReservation>;
  /** Newest first; null brings every status. */
  abstract findMine(status: ReservationStatus | null): Promise<Reservation[]>;
}
