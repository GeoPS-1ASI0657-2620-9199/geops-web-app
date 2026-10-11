import { Injectable, inject } from '@angular/core';
import { OfferRepository } from '../domain/ports/offer.repository';

/**
 * The closed list of categories of Catalog (US08, E2-06), for the search chips and the campaign form.
 * It changes only with a release, so the first answer is kept for the life of the tab.
 */
@Injectable({ providedIn: 'root' })
export class ListOfferCategoriesUseCase {
  private readonly offers = inject(OfferRepository);
  private cached: Promise<string[]> | null = null;

  execute(): Promise<string[]> {
    if (!this.cached) {
      this.cached = this.offers.categories().catch((error: unknown) => {
        this.cached = null;
        throw error;
      });
    }
    return this.cached;
  }
}
