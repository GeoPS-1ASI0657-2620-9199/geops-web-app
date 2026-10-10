import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, NETWORK_ERROR } from '../../shared/domain/api-error';
import { GeoPoint } from '../../shared/domain/geo-point';
import { LimaDistrict } from '../domain/model/lima-district';
import {
  DEFAULT_RADIUS_MINUTES,
  NearbyOffer,
  NearbyOfferPage,
  clampRadius,
  hasMorePages,
  widerRadius,
} from '../domain/model/nearby-offer';
import { LocateConsumerUseCase, PickDistrictReason } from './locate-consumer.use-case';
import { SearchNearbyOffersUseCase } from './search-nearby-offers.use-case';

export type SearchState = 'idle' | 'locating' | 'pick-district' | 'loading' | 'ready' | 'empty' | 'error';

/** Point the search starts from: the device reading or the center of a district. */
export interface SearchOrigin {
  readonly point: GeoPoint;
  readonly districtName?: string;
  readonly accuracyMeters?: number;
}

/**
 * The consumer's current search (US03, US46), shared by the Inicio, Ofertas and Categorías tabs so
 * the district and the radius survive a change of tab (Figma screens 1, 6, 23, 24 and 25).
 */
@Injectable({ providedIn: 'root' })
export class OfferSearchStore {
  private readonly locate = inject(LocateConsumerUseCase);
  private readonly search = inject(SearchNearbyOffersUseCase);

  readonly state = signal<SearchState>('idle');
  readonly origin = signal<SearchOrigin | null>(null);
  readonly pickReason = signal<PickDistrictReason | null>(null);
  readonly imprecision = signal<number | null>(null);
  readonly radius = signal(DEFAULT_RADIUS_MINUTES);
  readonly offers = signal<NearbyOffer[]>([]);
  readonly lastPage = signal<NearbyOfferPage | null>(null);
  readonly loadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly canLoadMore = computed(() => {
    const page = this.lastPage();
    return !!page && hasMorePages(page);
  });
  readonly nextRadius = computed(() => widerRadius(this.radius()));
  readonly total = computed(() => this.lastPage()?.totalElements ?? 0);
  /** Categories present in the results, in order of appearance, for the filter chips. */
  readonly categories = computed(() => [...new Set(this.offers().map((offer) => offer.category))]);

  /** Starts the search the first time a tab opens; later visits keep the previous one. */
  async ensureStarted(): Promise<void> {
    if (this.state() === 'idle') {
      await this.useDeviceLocation();
    }
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

  async chooseDistrict(district: LimaDistrict): Promise<void> {
    this.pickReason.set(null);
    this.origin.set({ point: district.center, districtName: district.name });
    await this.runSearch();
  }

  changeDistrict(): void {
    this.pickReason.set(null);
    this.state.set('pick-district');
  }

  async setRadius(minutes: number): Promise<void> {
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

  /** Loads every page, for the screens that count or sort all the offers in the radius. */
  async loadAll(): Promise<void> {
    while (this.canLoadMore() && this.state() === 'ready') {
      await this.loadMore();
    }
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
