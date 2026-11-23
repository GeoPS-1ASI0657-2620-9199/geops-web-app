import { Injectable, inject } from '@angular/core';
import { ModerationOffer, asRemoved, isValidReason } from '../domain/model/moderation';
import { ModerationRepository } from '../domain/ports/moderation.repository';

/**
 * Removes an offer that breaks the publication rules (US24). The reason is checked here too, so an
 * empty one never reaches Catalog; the offer comes back as REMOVED to update its row.
 */
@Injectable({ providedIn: 'root' })
export class RemoveOfferUseCase {
  private readonly moderation = inject(ModerationRepository);

  async execute(offer: ModerationOffer, reason: string): Promise<ModerationOffer> {
    if (!isValidReason(reason)) {
      throw new RangeError('The reason must have from 10 to 255 characters');
    }
    await this.moderation.remove(offer.offerId, reason.trim());
    return asRemoved(offer);
  }
}
