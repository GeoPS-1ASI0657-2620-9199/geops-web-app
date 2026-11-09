import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import { PublicSourceOffer } from '../../../domain/model/public-source-offer';
import { validityLabel } from '../../validity-label';

/**
 * "Fuentes públicas, sin garantía" (US39, CA-39.2): offers of businesses that are not affiliated, in
 * their own section below the affiliated ones, as reference cards with the source instead of a business.
 */
@Component({
  selector: 'app-public-source-offers',
  standalone: true,
  imports: [RouterLink, TranslateModule, GeoOfferCard],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (offers().length) {
      <section class="section" data-testid="public-sources" [attr.aria-label]="'publicSources.title' | translate">
        <h2 class="title">{{ 'publicSources.title' | translate }}</h2>
        <p class="description">{{ 'publicSources.description' | translate }}</p>
        <div class="grid">
          @for (offer of offers(); track offer.offerId) {
            <a class="card-link" [routerLink]="['/offers', offer.offerId]">
              <geo-offer-card
                kind="reference"
                [title]="offer.title"
                [merchant]="offer.sourceName"
                [imageUrl]="offer.imageUrl"
                [category]="offer.category"
                [validity]="validity(offer)"
                [price]="offer.price"
                [distanceMeters]="offer.distanceMeters"
                [walkMinutes]="offer.walkMinutes" />
            </a>
          }
        </div>
      </section>
    }
  `,
  styles: [
    `
      .section { display: flex; flex-direction: column; gap: var(--space-sm); margin-top: var(--space-lg); }
      .title { margin: 0; font: 600 17px/1.3 var(--font-brand); color: var(--text-primary); }
      .description { margin: 0; font: 400 12.5px/1.45 var(--font-brand); color: var(--text-dim); }
      .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: var(--space-sm); }
      .card-link { color: inherit; text-decoration: none; }
      @media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 640px) { .grid { grid-template-columns: 1fr; } }
    `,
  ],
})
export class PublicSourceOffers {
  readonly offers = input<readonly PublicSourceOffer[]>([]);

  protected validity(offer: PublicSourceOffer): string {
    return validityLabel(offer.validTo);
  }
}
