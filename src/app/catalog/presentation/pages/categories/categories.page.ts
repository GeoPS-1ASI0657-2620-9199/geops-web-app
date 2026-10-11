import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { TranslateModule } from '@ngx-translate/core';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoOffersMap, MapPin } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { MIN_RADIUS_MINUTES, NearbyOffer } from '../../../domain/model/nearby-offer';
import { RadiusControl } from '../../components/radius-control/radius-control';
import { SearchGate } from '../../components/search-gate/search-gate';
import { METERS_PER_WALK_MINUTE, placeLabelOf, toPins } from '../../search-view';

export type OfferOrder = 'distance' | 'price' | 'expiry';

const LIST_SIZE = 6;

export function sortOffers(offers: readonly NearbyOffer[], order: OfferOrder): NearbyOffer[] {
  const sorted = [...offers];
  if (order === 'price') {
    sorted.sort((a, b) => a.price - b.price || a.distanceMeters - b.distanceMeters);
  } else if (order === 'expiry') {
    sorted.sort((a, b) => a.validTo.localeCompare(b.validTo) || a.distanceMeters - b.distanceMeters);
  } else {
    sorted.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
  return sorted;
}

/**
 * Categorías tab (Figma screen 6): the walking radius, the category chips, how many offers there are
 * at 5 minutes and in the whole radius, the list ordered at will and the map of the zone.
 */
@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatIconModule, MatRadioModule, TranslateModule, GeoAlert, GeoOffersMap, RadiusControl, SearchGate],
  templateUrl: './categories.page.html',
  styleUrl: './categories.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesPage implements OnInit {
  protected readonly search = inject(OfferSearchStore);
  private readonly router = inject(Router);

  protected readonly order = signal<OfferOrder>('distance');
  protected readonly orders: OfferOrder[] = ['distance', 'price', 'expiry'];
  protected readonly minMinutes = MIN_RADIUS_MINUTES;

  /** Catalog already filtered them by the chosen category (US08). */
  protected readonly inCategory = this.search.offers;
  protected readonly withinMin = computed(() => this.inCategory().filter((o) => o.walkMinutes <= MIN_RADIUS_MINUTES).length);
  /** True once the map tiles failed: the list then carries every offer (US09, QAS12). */
  protected readonly mapFailed = signal(false);
  protected readonly list = computed(() => {
    const sorted = sortOffers(this.inCategory(), this.order());
    return this.mapFailed() ? sorted : sorted.slice(0, LIST_SIZE);
  });
  protected readonly pins = computed<MapPin[]>(() => toPins(this.inCategory()));
  protected readonly placeLabel = computed(() => placeLabelOf(this.search.origin()));
  protected readonly radiusMeters = computed(() => this.search.radius() * METERS_PER_WALK_MINUTE);
  protected readonly locationNote = computed(() => {
    const origin = this.search.origin();
    return origin && !origin.districtName ? `±${origin.accuracyMeters} m` : null;
  });

  async ngOnInit(): Promise<void> {
    await this.search.ensureStarted();
    await this.search.loadAll();
  }

  protected icon(offer: NearbyOffer): string {
    return categoryIcon(offer.category);
  }

  protected openOffer(offerId: number): void {
    void this.router.navigate(['/offers', offerId]);
  }

  protected async onRadius(minutes: number): Promise<void> {
    await this.search.setRadius(minutes);
    await this.search.loadAll();
  }

  protected async onCategory(category: string | null): Promise<void> {
    await this.search.selectCategory(category);
    await this.search.loadAll();
  }
}
