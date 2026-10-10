import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import { GeoOffersMap, MapPin } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { NearbyOffer } from '../../../domain/model/nearby-offer';
import { OfferCardActions } from '../../components/offer-card-actions/offer-card-actions';
import { SearchGate } from '../../components/search-gate/search-gate';
import { SearchPanel } from '../../components/search-panel/search-panel';
import { METERS_PER_WALK_MINUTE, placeLabelOf, precisionLabelOf, toPins } from '../../search-view';
import { validityLabel } from '../../validity-label';

const NEAR_YOU = 3;
const CARDS = 6;

/** Inicio of the buyer (Figma screen 1): greeting, search panel with the map and the nearest offers. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    MatIconModule,
    TranslateModule,
    GeoOfferCard,
    GeoOffersMap,
    OfferCardActions,
    SearchGate,
    SearchPanel,
  ],
  templateUrl: './home.page.html',
  styleUrl: './home.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage implements OnInit {
  protected readonly search = inject(OfferSearchStore);
  protected readonly sessions = inject(SessionStore);
  private readonly router = inject(Router);

  protected readonly category = signal<string | null>(null);
  protected readonly skeletons = [1, 2, 3];
  protected readonly filtered = computed(() => {
    const category = this.category();
    return this.search.offers().filter((offer) => !category || offer.category === category);
  });
  protected readonly nearYou = computed(() => this.filtered().slice(0, NEAR_YOU));
  protected readonly cards = computed(() => this.filtered().slice(0, CARDS));
  protected readonly pins = computed<MapPin[]>(() => toPins(this.filtered()));
  protected readonly placeLabel = computed(() => placeLabelOf(this.search.origin()));
  protected readonly precisionLabel = computed(() => precisionLabelOf(this.search.origin()));
  protected readonly radiusMeters = computed(() => this.search.radius() * METERS_PER_WALK_MINUTE);

  ngOnInit(): void {
    void this.search.ensureStarted();
  }

  protected validity(offer: NearbyOffer): string {
    return validityLabel(offer.validTo);
  }

  protected icon(offer: NearbyOffer): string {
    return categoryIcon(offer.category);
  }

  protected openOffer(offerId: number): void {
    void this.router.navigate(['/offers', offerId]);
  }

  protected async onRadius(minutes: number): Promise<void> {
    this.category.set(null);
    await this.search.setRadius(minutes);
  }
}
