/** An offer the consumer saved to come back to it (US12), as engagement-service returns it. */
export interface SavedOffer {
  readonly savedOfferId: number;
  readonly offerId: number;
  readonly businessId: number;
  readonly businessName: string;
  readonly title: string;
  /** Last valid day, ISO date (yyyy-mm-dd). */
  readonly validTo: string;
  /** Engagement decides it from the validity it keeps of the offer. */
  readonly expired: boolean;
  readonly savedAt: string;
}

/** Valid offers first and the expired ones apart, as the Favoritos screen shows them (Figma 10). */
export function splitByValidity(saved: readonly SavedOffer[]): { current: SavedOffer[]; expired: SavedOffer[] } {
  return {
    current: saved.filter((offer) => !offer.expired),
    expired: saved.filter((offer) => offer.expired),
  };
}
