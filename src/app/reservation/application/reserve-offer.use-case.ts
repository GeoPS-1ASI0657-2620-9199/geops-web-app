import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { PlacedReservation, isPositiveId } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';

export const INVALID_REQUEST = 'INVALID_REQUEST';
const INVALID_OFFER_MESSAGE = 'La oferta que intentas reservar no es válida.';

/** Reserves an offer that is paid at the business; no payment method is asked (US40). */
@Injectable({ providedIn: 'root' })
export class ReserveOfferUseCase {
  private readonly reservations = inject(ReservationRepository);

  execute(offerId: number): Promise<PlacedReservation> {
    if (!isPositiveId(offerId)) {
      return Promise.reject(new ApiError(INVALID_REQUEST, INVALID_OFFER_MESSAGE));
    }
    return this.reservations.reserve(offerId);
  }
}
