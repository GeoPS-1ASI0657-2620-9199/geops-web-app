import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { FindReservationByCodeUseCase, MALFORMED_CODE } from '../../../application/find-reservation-by-code.use-case';
import { RESERVATION_NOT_FOUND } from '../../../application/get-reservation.use-case';
import { RedeemReservationUseCase, Redemption } from '../../../application/redeem-reservation.use-case';
import { Reservation, isPastDeadline } from '../../../domain/model/reservation';
import { STATUS_SEAL, limaDateTime, limaTime, remainingTime } from '../../reservation-view';

/** Why a code cannot be charged; each one has its own text in validatePage.rejected.<REASON>. */
export type Rejection =
  | 'MALFORMED'
  | 'NOT_FOUND'
  | 'OTHER_BUSINESS'
  | 'REDEEMED'
  | 'EXPIRED'
  | 'REPORTED'
  | 'NETWORK'
  | 'UNEXPECTED';

/** Rejection of each error code of the lookup and of the delivery (E2-04). */
const REJECTION_BY_CODE: Readonly<Record<string, Rejection>> = {
  [MALFORMED_CODE]: 'MALFORMED',
  [RESERVATION_NOT_FOUND]: 'NOT_FOUND',
  FORBIDDEN: 'OTHER_BUSINESS',
  RESERVATION_EXPIRED: 'EXPIRED',
  RESERVATION_REPORTED: 'REPORTED',
  [NETWORK_ERROR]: 'NETWORK',
};

/**
 * Outcome of a lookup: a reservation that can be charged, or the reason it cannot. An ACTIVE
 * reservation past its deadline is expired as well (E2-05).
 */
export function rejectionOf(reservation: Reservation, now: number = Date.now()): Rejection | null {
  switch (reservation.status) {
    case 'ACTIVE':
      return isPastDeadline(reservation, now) ? 'EXPIRED' : null;
    case 'REDEEMED':
      return 'REDEEMED';
    case 'EXPIRED':
      return 'EXPIRED';
    default:
      return 'REPORTED';
  }
}

/**
 * "Validar código de reserva" of the business (US41, Figma screens 34 and 35): the owner types the
 * code the customer shows and sees whether to charge the offer price, or why not.
 */
@Component({
  selector: 'app-validate-code',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, TranslateModule, GeoSeal],
  templateUrl: './validate-code.page.html',
  styleUrl: './validate-code.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidateCodePage {
  private readonly findByCode = inject(FindReservationByCodeUseCase);
  private readonly redeem = inject(RedeemReservationUseCase);

  protected readonly code = signal('');
  protected readonly checking = signal(false);
  protected readonly reservation = signal<Reservation | null>(null);
  protected readonly rejection = signal<Rejection | null>(null);
  protected readonly redeeming = signal(false);
  /** The delivery once it is recorded; the code no longer admits a second use (CA-41.2). */
  protected readonly redemption = signal<Redemption | null>(null);
  protected readonly seals = STATUS_SEAL;
  protected readonly limaDateTime = limaDateTime;
  protected readonly limaTime = limaTime;
  protected readonly remaining = computed(() => {
    const reservation = this.reservation();
    return reservation ? remainingTime(reservation.expiresAt, Date.now()) : null;
  });

  async validate(): Promise<void> {
    if (!this.code().trim() || this.checking()) {
      return;
    }
    this.checking.set(true);
    this.reservation.set(null);
    this.rejection.set(null);
    this.redemption.set(null);
    try {
      const reservation = await this.findByCode.execute(this.code());
      this.reservation.set(reservation);
      this.rejection.set(rejectionOf(reservation));
    } catch (error) {
      this.rejection.set(this.rejectionFor(error));
    } finally {
      this.checking.set(false);
    }
  }

  /** "Confirmar entrega": records the delivery of the valid code on screen (US41). */
  async confirmDelivery(): Promise<void> {
    const reservation = this.reservation();
    if (!reservation || this.rejection() || this.redemption() || this.redeeming()) {
      return;
    }
    this.redeeming.set(true);
    try {
      const redemption = await this.redeem.execute(reservation.code);
      this.redemption.set(redemption);
      this.reservation.set({ ...reservation, status: 'REDEEMED', redeemedAt: redemption.redeemedAt });
    } catch (error) {
      this.rejection.set(this.rejectionFor(error, 'UNEXPECTED'));
    } finally {
      this.redeeming.set(false);
    }
  }

  clear(): void {
    this.code.set('');
    this.reservation.set(null);
    this.rejection.set(null);
    this.redemption.set(null);
  }

  /** A lookup that fails for an unknown reason reads as not found, as in the Sprint 1. */
  private rejectionFor(error: unknown, fallback: Rejection = 'NOT_FOUND'): Rejection {
    const code = error instanceof ApiError ? error.code : '';
    return REJECTION_BY_CODE[code] ?? fallback;
  }
}
