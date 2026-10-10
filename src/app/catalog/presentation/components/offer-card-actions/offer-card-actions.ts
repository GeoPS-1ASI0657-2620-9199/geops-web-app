import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SaveOfferUseCase } from '../../../../engagement/application/saved-offers.use-cases';
import { SessionStore } from '../../../../iam/application/session.store';
import { ReserveOfferUseCase } from '../../../../reservation/application/reserve-offer.use-case';
import { PLACED_PARAM } from '../../../../reservation/presentation/reservation-view';
import { ApiError } from '../../../../shared/domain/api-error';

const UNAUTHORIZED = 'UNAUTHORIZED';
/** Answers with their own text in offerActions.errors.<CODE>. */
const KNOWN_ERRORS = ['OFFER_NOT_AVAILABLE', 'OFFER_NOT_FOUND', 'OFFER_EXPIRED', 'CATALOG_UNAVAILABLE'];
const SNACK_MILLIS = 4000;

/**
 * "Reservar" and "Guardar" of the Figma offer card. Visitors are sent to log in first and come back;
 * business owners see no actions, since only consumers reserve (US40) and save (US12).
 */
@Component({
  selector: 'app-offer-card-actions',
  standalone: true,
  imports: [MatButtonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <button mat-flat-button class="small" type="button" [disabled]="busy()" (click)="reserve($event)">
        {{ 'offerActions.reserve' | translate }}
      </button>
      <button mat-stroked-button class="small" type="button" [disabled]="busy()" (click)="save($event)">
        {{ 'offerActions.save' | translate }}
      </button>
    }
  `,
  styles: [
    `
      :host { display: flex; gap: var(--space-sm); }
      .small { height: 30px; padding: 0 14px; font: 500 12px/1 var(--font-brand); }
    `,
  ],
})
export class OfferCardActions {
  private readonly sessions = inject(SessionStore);
  private readonly reserveOffer = inject(ReserveOfferUseCase);
  private readonly saveOffer = inject(SaveOfferUseCase);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  readonly offerId = input.required<number>();
  protected readonly busy = signal(false);
  protected readonly visible = computed(() => {
    const role = this.sessions.role();
    return role === null || role === 'CONSUMER';
  });

  async reserve(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!this.sessions.activeSession()) {
      await this.goToLogin();
      return;
    }
    await this.run(async () => {
      const placed = await this.reserveOffer.execute(this.offerId());
      await this.router.navigate(['/reservations', placed.reservationId], {
        queryParams: { [PLACED_PARAM]: placed.isNew ? 'new' : 'existing' },
      });
    });
  }

  async save(event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!this.sessions.activeSession()) {
      await this.goToLogin();
      return;
    }
    await this.run(async () => {
      await this.saveOffer.execute(this.offerId());
      this.notify('offerActions.saved');
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    try {
      await action();
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      if (apiError?.code === UNAUTHORIZED) {
        await this.goToLogin();
        return;
      }
      this.notify(
        apiError && KNOWN_ERRORS.includes(apiError.code)
          ? `offerActions.errors.${apiError.code}`
          : 'offerActions.errors.DEFAULT',
      );
    } finally {
      this.busy.set(false);
    }
  }

  private notify(key: string): void {
    this.snackBar.open(this.translate.instant(key), undefined, { duration: SNACK_MILLIS });
  }

  private goToLogin(): Promise<boolean> {
    return this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
  }
}
