import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { isWellFormedCode, normalizeCode } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';
import { MALFORMED_CODE, MALFORMED_MESSAGE } from './find-reservation-by-code.use-case';

export const RESERVATION_ALREADY_REDEEMED = 'RESERVATION_ALREADY_REDEEMED';

/** The delivery the counter records: the code and when it was redeemed. */
export interface Redemption {
  readonly code: string;
  readonly redeemedAt: string;
}

/**
 * The owner confirms the delivery of a code (US41). Reservation answers 409 with redeemedAt when the
 * code was already redeemed; it checks the business first, so that 409 is always a code of this
 * business, redeemed by a second click or by another device of the same counter. The delivery is
 * recorded either way, so the screen shows it as done instead of as a rejection.
 */
@Injectable({ providedIn: 'root' })
export class RedeemReservationUseCase {
  private readonly reservations = inject(ReservationRepository);

  async execute(typed: string): Promise<Redemption> {
    const code = normalizeCode(typed);
    if (!isWellFormedCode(code)) {
      throw new ApiError(MALFORMED_CODE, MALFORMED_MESSAGE);
    }
    try {
      const redeemed = await this.reservations.redeem(code);
      return { code: redeemed.code, redeemedAt: redeemed.redeemedAt };
    } catch (error) {
      if (error instanceof ApiError && error.code === RESERVATION_ALREADY_REDEEMED && error.redeemedAt) {
        return { code, redeemedAt: error.redeemedAt };
      }
      throw error;
    }
  }
}
