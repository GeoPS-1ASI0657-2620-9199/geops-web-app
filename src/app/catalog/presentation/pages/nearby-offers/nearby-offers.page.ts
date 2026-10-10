import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { NearbyOffer } from '../../../domain/model/nearby-offer';
import { OfferCardActions } from '../../components/offer-card-actions/offer-card-actions';
import { SearchGate } from '../../components/search-gate/search-gate';
import { SearchPanel } from '../../components/search-panel/search-panel';
import { matchesTerm, placeLabelOf } from '../../search-view';
import { validityLabel } from '../../validity-label';

/**
 * Ofertas tab: every valid offer in the radius as Figma offer cards, ordered by distance (US03,
 * GEO-113 to GEO-116), filtered by category and by the search box of the top bar (?q=).
 */
@Component({
  selector: 'app-nearby-offers',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    GeoEmptyState,
    GeoOfferCard,
    OfferCardActions,
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

  protected readonly term = toSignal(inject(ActivatedRoute).queryParamMap.pipe(map((params) => params.get('q') ?? '')), {
    initialValue: '',
  });
  protected readonly category = signal<string | null>(null);
  protected readonly skeletons = [1, 2, 3, 4, 5, 6];
  protected readonly placeLabel = computed(() => placeLabelOf(this.search.origin()));
  protected readonly visible = computed(() => {
    const category = this.category();
    const term = this.term();
    return this.search
      .offers()
      .filter((offer) => (!category || offer.category === category) && matchesTerm(offer, term));
  });

  ngOnInit(): void {
    void this.search.ensureStarted();
  }

  protected validity(offer: NearbyOffer): string {
    return validityLabel(offer.validTo);
  }

  protected clearTerm(): void {
    void this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge' });
  }

  protected async onRadius(minutes: number): Promise<void> {
    this.category.set(null);
    await this.search.setRadius(minutes);
  }
}
