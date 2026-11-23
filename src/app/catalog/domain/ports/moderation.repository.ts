import {
  ModerationAction,
  ModerationEntry,
  ModerationFilter,
  ModerationOffer,
  ModerationResults,
} from '../model/moderation';

/** Port to the moderation routes of Catalog (/api/v1/admin). The token of the administrator is added by the interceptor. */
export abstract class ModerationRepository {
  abstract findOffers(filter: ModerationFilter, page: number, size: number): Promise<ModerationResults<ModerationOffer>>;
  /** Removes the offer with the reason; Catalog records who removed it and when. */
  abstract remove(offerId: number, reason: string): Promise<ModerationAction>;
  abstract findHistory(page: number, size: number): Promise<ModerationResults<ModerationEntry>>;
}
