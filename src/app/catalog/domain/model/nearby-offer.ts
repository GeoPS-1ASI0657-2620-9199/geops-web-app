/** Search limits of US02 and US03 (Informe 4.3.2.5, BRD-04): radius in walking minutes. */
export const MIN_RADIUS_MINUTES = 5;
export const MAX_RADIUS_MINUTES = 20;
export const DEFAULT_RADIUS_MINUTES = 10;
/** How much the empty state widens the search each time (E-05). */
export const RADIUS_STEP_MINUTES = 5;
export const PAGE_SIZE = 20;

/** An offer around the consumer, as GET /api/v1/offers/nearby returns it (BRD-04 §6). */
export interface NearbyOffer {
  readonly offerId: number;
  readonly title: string;
  readonly businessId: number;
  readonly businessName: string;
  readonly verifiedSeal: boolean;
  readonly distanceMeters: number;
  readonly walkMinutes: number;
  readonly category: string;
  readonly price: number;
  /** Last valid day, ISO date (yyyy-mm-dd). */
  readonly validTo: string;
}

export interface NearbyOfferPage {
  readonly offers: NearbyOffer[];
  readonly page: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export function hasMorePages(result: NearbyOfferPage): boolean {
  return result.page + 1 < result.totalPages;
}

export function clampRadius(minutes: number): number {
  return Math.min(MAX_RADIUS_MINUTES, Math.max(MIN_RADIUS_MINUTES, Math.round(minutes)));
}

/** Next radius the empty state offers, or null when the platform limit was reached (CA-03.3). */
export function widerRadius(minutes: number): number | null {
  return minutes >= MAX_RADIUS_MINUTES ? null : Math.min(MAX_RADIUS_MINUTES, minutes + RADIUS_STEP_MINUTES);
}
