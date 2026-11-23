import { Injectable, inject } from '@angular/core';
import { ModerationEntry, ModerationResults } from '../domain/model/moderation';
import { ModerationRepository } from '../domain/ports/moderation.repository';
import { MODERATION_PAGE_SIZE } from './list-offers-for-moderation.use-case';

/** Who removed which offer, when and why, the most recent first (US24). */
@Injectable({ providedIn: 'root' })
export class ListModerationHistoryUseCase {
  private readonly moderation = inject(ModerationRepository);

  execute(page = 0): Promise<ModerationResults<ModerationEntry>> {
    return this.moderation.findHistory(page, MODERATION_PAGE_SIZE);
  }
}
