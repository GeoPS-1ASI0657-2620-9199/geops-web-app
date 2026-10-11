import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError, NETWORK_ERROR } from '../../shared/domain/api-error';
import { GeoPoint } from '../../shared/domain/geo-point';
import { LimaDistrict } from '../domain/model/lima-district';
import { GrantedReading } from '../domain/model/location-reading';
import {
  NearbyOffer,
  NearbyOfferPage,
  clampRadius,
  hasMorePages,
  widerRadius,
} from '../domain/model/nearby-offer';
import { LocateConsumerUseCase, PickDistrictReason } from './locate-consumer.use-case';
import { ListOfferCategoriesUseCase } from './list-offer-categories.use-case';
import { SearchNearbyOffersUseCase } from './search-nearby-offers.use-case';
import { SearchRadiusPreference } from './search-radius-preference';

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
  private readonly preference = inject(SearchRadiusPreference);
  private readonly listCategories = inject(ListOfferCategoriesUseCase);

  readonly state = signal<SearchState>('idle');
  readonly origin = signal<SearchOrigin | null>(null);
  readonly pickReason = signal<PickDistrictReason | null>(null);
  readonly imprecision = signal<number | null>(null);
  /** Starts at the last radius chosen in this browser (US46). */
  readonly radius = signal(this.preference.current());
  /** The imprecise reading the consumer may confirm instead of picking a district (QAS14). */
  private readonly impreciseReading = signal<GrantedReading | null>(null);
  readonly offers = signal<NearbyOffer[]>([]);
  readonly lastPage = signal<NearbyOfferPage | null>(null);
  readonly loadingMore = signal(false);
  readonly errorMessage = signal<string | null>(null);
  /** The category chip chosen; Catalog filters with it before paging (US08). */
  readonly category = signal<string | null>(null);
  private readonly categoryList = signal<string[]>([]);

  readonly canLoadMore = computed(() => {
    const page = this.lastPage();
    return !!page && hasMorePages(page);
  });
  readonly nextRadius = computed(() => widerRadius(this.radius()));
  /** True while there is an imprecise reading the consumer can still confirm. */
  readonly canConfirmReading = computed(() => this.impreciseReading() !== null);
  readonly total = computed(() => this.lastPage()?.totalElements ?? 0);
  /**
   * The chips: the closed list of Catalog. If it could not be read, the categories present in the
   * results, so the filter still works.
   */
  readonly categories = computed(() => {
    const list = this.categoryList();
    return list.length ? list : [...new Set(this.offers().map((offer) => offer.category))];
  });

  /**
   * Starts the search the first time a tab opens; later visits keep the previous one, unless a
   * consumer just logged in with another radius saved in the profile (US46, scenario 4).
   */
  async ensureStarted(): Promise<void> {
    if (this.state() === 'idle') {
      // Marked before the first await, so two tabs opening at once start a single search.
      this.state.set('locating');
      void this.loadCategories();
      this.radius.set((await this.preference.resolve()).minutes);
      await this.useDeviceLocation();
      return;
    }
    const saved = await this.preference.resolve();
    if (saved.fromProfile && saved.minutes !== this.radius()) {
      this.radius.set(saved.minutes);
      await this.runSearch();
    }
  }

  async useDeviceLocation(): Promise<void> {
    this.state.set('locating');
    const start = await this.locate.execute();
    if (start.kind === 'POINT') {
      await this.searchFrom(start.reading);
      return;
    }
    this.pickReason.set(start.reason);
    this.imprecision.set(start.accuracyMeters ?? null);
    this.impreciseReading.set(start.reading ?? null);
    this.state.set('pick-district');
  }

  /** The consumer accepts the imprecise point after the warning (QAS14). */
  async confirmImpreciseReading(): Promise<void> {
    const reading = this.impreciseReading();
    if (reading) {
      await this.searchFrom(reading);
    }
  }

  async chooseDistrict(district: LimaDistrict): Promise<void> {
    this.pickReason.set(null);
    this.impreciseReading.set(null);
    this.origin.set({ point: district.center, districtName: district.name });
    await this.runSearch();
  }

  changeDistrict(): void {
    this.pickReason.set(null);
    this.state.set('pick-district');
  }

  async setRadius(minutes: number): Promise<void> {
    this.chooseRadius(clampRadius(minutes));
    await this.runSearch();
  }

  async widenRadius(): Promise<void> {
    const next = this.nextRadius();
    if (next !== null) {
      this.chooseRadius(next);
      await this.runSearch();
    }
  }

  /** Searches again from page 0 with the chosen category, or with every one for null. */
  async selectCategory(category: string | null): Promise<void> {
    if (category === this.category()) {
      return;
    }
    this.category.set(category);
    await this.runSearch();
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
      const next = await this.search.execute(origin.point, this.radius(), page.page + 1, this.category());
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

  private chooseRadius(minutes: number): void {
    this.radius.set(minutes);
    this.preference.remember(minutes);
  }

  private async searchFrom(reading: GrantedReading): Promise<void> {
    this.pickReason.set(null);
    this.imprecision.set(null);
    this.impreciseReading.set(null);
    this.origin.set({ point: reading.point, accuracyMeters: Math.round(reading.accuracyMeters) });
    await this.runSearch();
  }

  private async runSearch(): Promise<void> {
    const origin = this.origin();
    if (!origin) {
      return;
    }
    this.state.set('loading');
    this.offers.set([]);
    try {
      const result = await this.search.execute(origin.point, this.radius(), 0, this.category());
      this.offers.set(result.offers);
      this.lastPage.set(result);
      this.state.set(result.totalElements === 0 ? 'empty' : 'ready');
    } catch (error) {
      this.showError(error);
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      this.categoryList.set(await this.listCategories.execute());
    } catch {
      // The chips fall back to the categories of the results.
    }
  }

  private showError(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    this.errorMessage.set(apiError && apiError.code !== NETWORK_ERROR ? apiError.message : null);
    this.state.set('error');
  }
}
