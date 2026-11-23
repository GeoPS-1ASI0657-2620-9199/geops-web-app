import { Injectable, inject } from '@angular/core';
import { ModerationFilter, ModerationOffer, ModerationResults } from '../domain/model/moderation';
import { ModerationRepository } from '../domain/ports/moderation.repository';

export const MODERATION_PAGE_SIZE = 20;

/** Lists the offers of the catalog with their status for the administrator (US24). */
@Injectable({ providedIn: 'root' })
export class ListOffersForModerationUseCase {
  private readonly moderation = inject(ModerationRepository);

  execute(filter: ModerationFilter, page = 0): Promise<ModerationResults<ModerationOffer>> {
    return this.moderation.findOffers(filter, page, MODERATION_PAGE_SIZE);
  }
}
