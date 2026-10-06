import { PlacedReservation, Reservation, ReservationStatus } from '../model/reservation';

/**
 * Port to reservation-service. The consumer comes from the token the interceptor adds.
 * Implementations reject with ApiError.
 */
export abstract class ReservationRepository {
  abstract reserve(offerId: number): Promise<PlacedReservation>;
  abstract findById(reservationId: number): Promise<Reservation>;
  /** Newest first; null brings every status. */
  abstract findMine(status: ReservationStatus | null): Promise<Reservation[]>;
}
