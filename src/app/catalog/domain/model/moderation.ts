/** Status of an offer as Catalog keeps it; REMOVED is the result of a moderation (US24). */
export type ModeratedOfferStatus = 'PUBLISHED' | 'EXPIRED' | 'REMOVED';

/** Shortest reason Catalog accepts for a removal; the longest is 255 characters. */
export const MIN_REASON_LENGTH = 10;
export const MAX_REASON_LENGTH = 255;

/** An offer of the catalog as the administrator sees it in the moderation panel. */
export interface ModerationOffer {
  readonly offerId: number;
  readonly title: string;
  readonly category: string;
  readonly source: 'AFFILIATED' | 'PUBLIC_SOURCE';
  readonly businessId: number | null;
  /** The business, or the source name for a public source offer. */
  readonly businessName: string | null;
  readonly status: ModeratedOfferStatus;
  readonly validTo: string;
  readonly openReports: number;
  readonly verifiedSeal: boolean;
}

/** One row of the moderation history: which offer, which administrator, when and why. */
export interface ModerationEntry {
  readonly moderationId: number;
  readonly offerId: number;
  readonly offerTitle: string;
  readonly adminId: number;
  readonly reason: string;
  readonly removedAt: string;
}

/** What Catalog answers after a removal. */
export interface ModerationAction {
  readonly moderationId: number;
  readonly offerId: number;
  readonly adminId: number;
  readonly reason: string;
  readonly removedAt: string;
}

export interface ModerationResults<T> {
  readonly items: T[];
  readonly page: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/** Filter of the panel. Without status every status is listed. */
export interface ModerationFilter {
  readonly status: ModeratedOfferStatus | null;
  readonly reportedOnly: boolean;
  readonly text: string;
}

/** A reason Catalog will accept: 10 to 255 characters once the spaces around it are dropped. */
export function isValidReason(reason: string): boolean {
  const length = reason.trim().length;
  return length >= MIN_REASON_LENGTH && length <= MAX_REASON_LENGTH;
}

/** The offer as it is right after the removal, so the row changes without reloading the page. */
export function asRemoved(offer: ModerationOffer): ModerationOffer {
  return { ...offer, status: 'REMOVED' };
}
