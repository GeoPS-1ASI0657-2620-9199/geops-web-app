import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { GeoPoint } from '../../../../shared/domain/geo-point';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import { LocateConsumerUseCase, PickDistrictReason } from '../../../application/locate-consumer.use-case';
import { SearchNearbyOffersUseCase } from '../../../application/search-nearby-offers.use-case';
import { LimaDistrict } from '../../../domain/model/lima-district';
import {
  DEFAULT_RADIUS_MINUTES,
  NearbyOffer,
  NearbyOfferPage,
  clampRadius,
  hasMorePages,
  widerRadius,
} from '../../../domain/model/nearby-offer';
import { DistrictSelector } from '../../components/district-selector/district-selector';
import { RadiusControl } from '../../components/radius-control/radius-control';
import { validityLabel } from '../../validity-label';

type ViewState = 'locating' | 'pick-district' | 'loading' | 'ready' | 'empty' | 'error';

/** Point the search starts from: the device reading or the center of a district. */
interface SearchOrigin {
  readonly point: GeoPoint;
  readonly districtName?: string;
  readonly accuracyMeters?: number;
}

const SKELETON_CARDS = [1, 2, 3];

/** Nearby offers ordered by distance (US03; GEO-113 to GEO-116; Figma screens 1, 3, 23, 24, 25). */
@Component({
  selector: 'app-nearby-offers',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    GeoAlert,
    GeoEmptyState,
    GeoOfferCard,
    DistrictSelector,
    RadiusControl,
  ],
  templateUrl: './nearby-offers.page.html',
  styleUrl: './nearby-offers.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearbyOffersPage implements OnInit {
  private readonly locate = inject(LocateConsumerUseCase);
  private readonly search = inject(SearchNearbyOffersUseCase);

  protected readonly skeletons = SKELETON_CARDS;
  protected readonly state = signal<ViewState>('locating');
  protected readonly origin = signal<SearchOrigin | null>(null);
  protected readonly pickReason = signal<PickDistrictReason | null>(null);
  protected readonly imprecision = signal<number | null>(null);
  protected readonly radius = signal(DEFAULT_RADIUS_MINUTES);
  protected readonly offers = signal<NearbyOffer[]>([]);
  protected readonly lastPage = signal<NearbyOfferPage | null>(null);
  protected readonly loadingMore = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly canLoadMore = computed(() => {
    const page = this.lastPage();
    return !!page && hasMorePages(page);
  });
  protected readonly nextRadius = computed(() => widerRadius(this.radius()));

  ngOnInit(): void {
    void this.useDeviceLocation();
  }

  async useDeviceLocation(): Promise<void> {
    this.state.set('locating');
    const start = await this.locate.execute();
    if (start.kind === 'POINT') {
      this.pickReason.set(null);
      this.imprecision.set(null);
      this.origin.set({ point: start.reading.point, accuracyMeters: Math.round(start.reading.accuracyMeters) });
      await this.runSearch();
      return;
    }
    this.pickReason.set(start.reason);
    this.imprecision.set(start.accuracyMeters ?? null);
    this.state.set('pick-district');
  }

  async onDistrictSelected(district: LimaDistrict): Promise<void> {
    this.origin.set({ point: district.center, districtName: district.name });
    await this.runSearch();
  }

  changeDistrict(): void {
    this.pickReason.set(null);
    this.state.set('pick-district');
  }

  async onRadiusChanged(minutes: number): Promise<void> {
    this.radius.set(clampRadius(minutes));
    await this.runSearch();
  }

  async widenRadius(): Promise<void> {
    const next = this.nextRadius();
    if (next !== null) {
      this.radius.set(next);
      await this.runSearch();
    }
  }

  async retry(): Promise<void> {
    await this.runSearch();
  }

  async loadMore(): Promise<void> {
    const origin = this.origin();
    const page = this.lastPage();
    if (!origin || !page || this.loadingMore()) {
      return;
    }
    this.loadingMore.set(true);
    try {
      const next = await this.search.execute(origin.point, this.radius(), page.page + 1);
      this.offers.update((current) => [...current, ...next.offers]);
      this.lastPage.set(next);
    } catch (error) {
      this.showError(error);
    } finally {
      this.loadingMore.set(false);
    }
  }

  protected validity(offer: NearbyOffer): string {
    return validityLabel(offer.validTo);
  }

  private async runSearch(): Promise<void> {
    const origin = this.origin();
    if (!origin) {
      return;
    }
    this.state.set('loading');
    this.offers.set([]);
    try {
      const result = await this.search.execute(origin.point, this.radius());
      this.offers.set(result.offers);
      this.lastPage.set(result);
      this.state.set(result.totalElements === 0 ? 'empty' : 'ready');
    } catch (error) {
      this.showError(error);
    }
  }

  private showError(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    this.errorMessage.set(apiError && apiError.code !== NETWORK_ERROR ? apiError.message : null);
    this.state.set('error');
  }
}
