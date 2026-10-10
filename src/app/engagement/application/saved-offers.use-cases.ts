import { Injectable, inject } from '@angular/core';
import { SavedOffer } from '../domain/model/saved-offer';
import { SavedOfferRepository } from '../domain/ports/saved-offer.repository';

/** The consumer's saved offers, newest first (US12). */
@Injectable({ providedIn: 'root' })
export class ListSavedOffersUseCase {
  private readonly savedOffers = inject(SavedOfferRepository);

  async execute(): Promise<SavedOffer[]> {
    const saved = await this.savedOffers.findMine();
    return [...saved].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  }
}

/** Saves an offer; saving it twice keeps a single entry (engagement-service answers 200). */
@Injectable({ providedIn: 'root' })
export class SaveOfferUseCase {
  private readonly savedOffers = inject(SavedOfferRepository);

  execute(offerId: number): Promise<void> {
    return this.savedOffers.save(offerId);
  }
}

@Injectable({ providedIn: 'root' })
export class RemoveSavedOfferUseCase {
  private readonly savedOffers = inject(SavedOfferRepository);

  execute(offerId: number): Promise<void> {
    return this.savedOffers.remove(offerId);
  }
}
