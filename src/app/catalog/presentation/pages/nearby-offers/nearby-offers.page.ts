import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { firstValueFrom, skip } from 'rxjs';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import { GeoOffersMap, MapPin } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { NearbyOffer } from '../../../domain/model/nearby-offer';
import { OfferCardActions } from '../../components/offer-card-actions/offer-card-actions';
import { PublicSourceOffers } from '../../components/public-source-offers/public-source-offers';
import { SearchGate } from '../../components/search-gate/search-gate';
import { SearchPanel } from '../../components/search-panel/search-panel';
import { OfferOrder, sortOffers } from '../../offer-order';
import { METERS_PER_WALK_MINUTE, placeLabelOf, precisionLabelOf, publicOfferMatches, toPins } from '../../search-view';
import { validityLabel } from '../../validity-label';

export type OffersView = 'list' | 'map';

/** Parameter of the address with the category chip, which Categorías also sends (US08). */
const CATEGORY_PARAM = 'categoria';
/** Parameter of the address with the text of the top bar search. */
const TERM_PARAM = 'q';

/**
 * Ofertas tab: the one search screen of the buyer. Every valid offer in the radius (US03, GEO-113 to
 * GEO-116), filtered by category (US08, also when Categorías sends ?categoria=) and by the search box
 * of the top bar (?q=), both on the server before paging, ordered at will, as cards or on the map.
 * The address always carries both filters, so a reload or a shared link shows the same results.
 */
@Component({
  selector: 'app-nearby-offers',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    TranslateModule,
    GeoAlert,
    GeoEmptyState,
    GeoOfferCard,
    GeoOffersMap,
    OfferCardActions,
    PublicSourceOffers,
    SearchGate,
    SearchPanel,
  ],
  templateUrl: './nearby-offers.page.html',
  styleUrl: './nearby-offers.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NearbyOffersPage implements OnInit {
  protected readonly search = inject(OfferSearchStore);
  private readonly router = inject(Router);
  private readonly params = inject(ActivatedRoute).queryParamMap;

  /** The text Catalog filtered with, already normalized; null without search. */
  protected readonly term = computed(() => this.search.term());
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];
  protected readonly order = signal<OfferOrder>('distance');
  protected readonly view = signal<OffersView>('list');
  /** True once the map tiles failed: the cards then carry every offer (US09, QAS12). */
  protected readonly mapFailed = signal(false);
  protected readonly placeLabel = computed(() => placeLabelOf(this.search.origin()));
  protected readonly precisionLabel = computed(() => precisionLabelOf(this.search.origin()));
  protected readonly radiusMeters = computed(() => this.search.radius() * METERS_PER_WALK_MINUTE);
  /** Catalog already filtered by category (US08) and by the text of the top bar; the page only sorts. */
  protected readonly visible = computed(() => sortOffers(this.search.offers(), this.order()));
  /**
   * The public sources come in a single page of their own query, which takes no text; the text is
   * applied to that page here so the section agrees with the search.
   */
  protected readonly visiblePublic = computed(() => {
    const term = this.term();
    const offers = this.search.publicOffers();
    return term ? offers.filter((offer) => publicOfferMatches(offer, term)) : offers;
  });
  protected readonly pins = computed<MapPin[]>(() => toPins(this.visible(), this.visiblePublic()));
  protected readonly showMap = computed(() => this.view() === 'map' && !this.mapFailed());

  constructor() {
    // A new search from the top bar, clearing it, or the Ofertas tab opened again while it is open.
    this.params.pipe(skip(1), takeUntilDestroyed()).subscribe((params) => void this.followAddress(params));
  }

  async ngOnInit(): Promise<void> {
    const params = await firstValueFrom(this.params);
    // Categorías opens this tab with ?categoria=<name>; without the parameter the current filter stays.
    const category = params.get(CATEGORY_PARAM);
    const started = this.search.ensureStarted(params.get(TERM_PARAM), category ?? undefined);
    this.writeCategory(params);
    await started;
  }

  protected validity(offer: NearbyOffer): string {
    return validityLabel(offer.validTo);
  }

  /** Removes only the text: the category stays in the address and in the results. */
  protected clearTerm(): void {
    void this.router.navigate([], {
      queryParams: { [TERM_PARAM]: null, [CATEGORY_PARAM]: this.search.category() },
      queryParamsHandling: 'merge',
    });
  }

  protected openOffer(offerId: number): void {
    void this.router.navigate(['/offers', offerId]);
  }

  protected async onRadius(minutes: number): Promise<void> {
    await this.search.setRadius(minutes);
  }

  protected async onCategory(category: string | null): Promise<void> {
    // The address keeps the filter, so going back from an offer returns to the same results.
    void this.router.navigate([], { queryParams: { [CATEGORY_PARAM]: category }, queryParamsHandling: 'merge', replaceUrl: true });
    await this.search.selectCategory(category);
  }

  /**
   * The address changed while the tab is open. The text always follows it; a category in it is applied,
   * and an address without one (a search from the top bar, the Ofertas tab) gets the current one back.
   */
  private async followAddress(params: ParamMap): Promise<void> {
    // Both filters at once, so a change of text and category runs a single search.
    const done = this.search.ensureStarted(params.get(TERM_PARAM), params.get(CATEGORY_PARAM) ?? undefined);
    this.writeCategory(params);
    await done;
  }

  /** Puts the category of the search in the address when it is not there yet, without a new history entry. */
  private writeCategory(params: ParamMap): void {
    const current = this.search.category();
    if ((params.get(CATEGORY_PARAM) || null) !== current) {
      void this.router.navigate([], {
        queryParams: { [CATEGORY_PARAM]: current },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }
}
