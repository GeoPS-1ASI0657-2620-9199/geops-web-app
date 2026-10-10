import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { ListMyReservationsUseCase } from '../../../application/list-my-reservations.use-case';
import { Reservation, ReservationStatus } from '../../../domain/model/reservation';
import { STATUS_SEAL, limaDateTime } from '../../reservation-view';

type ViewState = 'loading' | 'ready' | 'empty' | 'error';
type Filter = ReservationStatus | 'ALL';

/** Figma screen 4: Activos, Canjeados and Vencidos; the reported ones and all of them after. */
const FILTERS: readonly Filter[] = ['ACTIVE', 'REDEEMED', 'EXPIRED', 'REPORTED', 'ALL'];
const SKELETON_CARDS = [1, 2, 3];

/** "Mis Cupones": the reservations of the consumer by status (US40, Figma screens 4 and 27). */
@Component({
  selector: 'app-my-reservations',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoEmptyState, GeoSeal],
  templateUrl: './my-reservations.page.html',
  styleUrl: './my-reservations.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyReservationsPage implements OnInit {
  private readonly listReservations = inject(ListMyReservationsUseCase);

  protected readonly filters = FILTERS;
  protected readonly skeletons = SKELETON_CARDS;
  protected readonly seals = STATUS_SEAL;
  protected readonly limaDateTime = limaDateTime;
  protected readonly filter = signal<Filter>('ACTIVE');
  protected readonly state = signal<ViewState>('loading');
  protected readonly reservations = signal<Reservation[]>([]);
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  select(filter: Filter): void {
    if (filter === this.filter()) {
      return;
    }
    this.filter.set(filter);
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    const filter = this.filter();
    try {
      const reservations = await this.listReservations.execute(filter === 'ALL' ? null : filter);
      this.reservations.set(reservations);
      this.state.set(reservations.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.state.set('error');
    }
  }
}
