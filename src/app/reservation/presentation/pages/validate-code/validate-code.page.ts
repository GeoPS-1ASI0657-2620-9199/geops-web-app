import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { FindReservationByCodeUseCase, MALFORMED_CODE } from '../../../application/find-reservation-by-code.use-case';
import { RESERVATION_NOT_FOUND } from '../../../application/get-reservation.use-case';
import { Reservation } from '../../../domain/model/reservation';
import { STATUS_SEAL, limaDateTime, remainingTime } from '../../reservation-view';

/** Why a code cannot be charged; each one has its own text in validatePage.rejected.<REASON>. */
export type Rejection = 'MALFORMED' | 'NOT_FOUND' | 'OTHER_BUSINESS' | 'REDEEMED' | 'EXPIRED' | 'REPORTED' | 'NETWORK';

/** Outcome of a lookup: a reservation that can be charged, or the reason it cannot. */
export function rejectionOf(reservation: Reservation): Rejection | null {
  switch (reservation.status) {
    case 'ACTIVE':
      return null;
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

  protected readonly code = signal('');
  protected readonly checking = signal(false);
  protected readonly reservation = signal<Reservation | null>(null);
  protected readonly rejection = signal<Rejection | null>(null);
  protected readonly seals = STATUS_SEAL;
  protected readonly limaDateTime = limaDateTime;
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

  clear(): void {
    this.code.set('');
    this.reservation.set(null);
    this.rejection.set(null);
  }

  private rejectionFor(error: unknown): Rejection {
    const code = error instanceof ApiError ? error.code : null;
    if (code === MALFORMED_CODE) {
      return 'MALFORMED';
    }
    if (code === RESERVATION_NOT_FOUND) {
      return 'NOT_FOUND';
    }
    if (code === 'FORBIDDEN') {
      return 'OTHER_BUSINESS';
    }
    return code === NETWORK_ERROR ? 'NETWORK' : 'NOT_FOUND';
  }
}
