import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { Reservation, isWellFormedCode } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';

export const MALFORMED_CODE = 'MALFORMED_CODE';
const MALFORMED_MESSAGE = 'El código tiene 8 letras y números, sin 0, O, 1, I ni L.';

/**
 * The owner looks a code up before charging (US41, Figma screen 34). Codes are typed in any case and
 * with spaces; reservation-service stores them in capitals.
 */
@Injectable({ providedIn: 'root' })
export class FindReservationByCodeUseCase {
  private readonly reservations = inject(ReservationRepository);

  execute(typed: string): Promise<Reservation> {
    const code = typed.replace(/[\s-]/g, '').toUpperCase();
    if (!isWellFormedCode(code)) {
      return Promise.reject(new ApiError(MALFORMED_CODE, MALFORMED_MESSAGE));
    }
    return this.reservations.findByCode(code);
  }
}
