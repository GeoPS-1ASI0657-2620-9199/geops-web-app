import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { GetReservationUseCase, RESERVATION_NOT_FOUND } from '../../../application/get-reservation.use-case';
import { Reservation } from '../../../domain/model/reservation';
import { PLACED_PARAM, STATUS_SEAL, limaDateTime } from '../../reservation-view';

/** The reservation is missing or belongs to another account: either way there is nothing to retry. */
const NOT_FOUND_CODES = [RESERVATION_NOT_FOUND, 'FORBIDDEN'];

type ViewState = 'loading' | 'ready' | 'not-found' | 'error';
type Placed = 'new' | 'existing' | null;

/** "Mi reserva": the code to show at the business and how to pay there (US40, Figma screen 4). */
@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState, GeoSeal],
  templateUrl: './reservation-detail.page.html',
  styleUrl: './reservation-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPage implements OnInit {
  private readonly getReservation = inject(GetReservationUseCase);
  private readonly route = inject(ActivatedRoute).snapshot;
  private readonly reservationId = Number(this.route.paramMap.get('id'));

  protected readonly placed = this.route.queryParamMap.get(PLACED_PARAM) as Placed;
  protected readonly state = signal<ViewState>('loading');
  protected readonly reservation = signal<Reservation | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly seal = computed(() => STATUS_SEAL[this.reservation()?.status ?? 'ACTIVE']);
  protected readonly isActive = computed(() => this.reservation()?.status === 'ACTIVE');
  protected readonly limaDateTime = limaDateTime;

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.reservation.set(await this.getReservation.execute(this.reservationId));
      this.state.set('ready');
    } catch (error) {
      this.showFailure(error);
    }
  }

  private showFailure(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError && NOT_FOUND_CODES.includes(apiError.code)) {
      this.state.set('not-found');
      return;
    }
    this.errorMessage.set(apiError?.message ?? null);
    this.state.set('error');
  }
}
