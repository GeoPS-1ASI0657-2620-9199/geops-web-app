import { PlacedReservation, Reservation, ReservationStatus } from '../model/reservation';

/**
 * Port to reservation-service. The consumer comes from the token the interceptor adds.
 * Implementations reject with ApiError.
 */
export abstract class ReservationRepository {
  abstract reserve(offerId: number): Promise<PlacedReservation>;
  abstract findById(reservationId: number): Promise<Reservation>;
  /** Newest first; null brings every status. */
  /** A reservation of the owner's business by its code, to validate it at the counter (US41). */
  abstract findByCode(code: string): Promise<Reservation>;
  abstract findMine(status: ReservationStatus | null): Promise<Reservation[]>;
}
