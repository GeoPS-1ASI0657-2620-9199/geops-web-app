import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { Reservation, isPositiveId } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';

export const RESERVATION_NOT_FOUND = 'RESERVATION_NOT_FOUND';
const NOT_FOUND_MESSAGE = 'Esta reserva no existe.';

/** One reservation of the consumer in the session, with its code and status. */
@Injectable({ providedIn: 'root' })
export class GetReservationUseCase {
  private readonly reservations = inject(ReservationRepository);

  execute(reservationId: number): Promise<Reservation> {
    if (!isPositiveId(reservationId)) {
      return Promise.reject(new ApiError(RESERVATION_NOT_FOUND, NOT_FOUND_MESSAGE));
    }
    return this.reservations.findById(reservationId);
  }
}
