import { GeoPoint } from '../../../shared/domain/geo-point';

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
  readonly address: string;
  /** Photo of the offer, or null when the business did not upload one. */
  readonly imageUrl: string | null;
  /** Where the offer is redeemed, for the map pins. */
  readonly location: GeoPoint;
  readonly price: number;
  /** Price before the offer, struck through on the card; null when the business did not give one. */
  readonly regularPrice?: number | null;
  /** Last valid day, ISO date (yyyy-mm-dd). */
  readonly validTo: string;
}

export interface NearbyOfferPage {
  readonly offers: NearbyOffer[];
  readonly page: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

/** Length Catalog accepts for the text of the search (SearchText in catalog-service). */
export const SEARCH_TERM_MIN_LENGTH = 2;
export const SEARCH_TERM_MAX_LENGTH = 60;

/**
 * The text of the top bar search as Catalog expects it: trimmed, inner spaces collapsed and cut at
 * 60 characters. null when there is nothing to search or it is a single character, which Catalog
 * would reject.
 */
export function searchTermOf(raw: string | null | undefined): string | null {
  const term = (raw ?? '').trim().replace(/\s+/g, ' ').slice(0, SEARCH_TERM_MAX_LENGTH).trim();
  return term.length >= SEARCH_TERM_MIN_LENGTH ? term : null;
}

export function hasMorePages(result: NearbyOfferPage): boolean {
  return result.page + 1 < result.totalPages;
}

/** A radius Catalog and Identity accept: whole minutes from 5 to 20. */
export function isValidRadius(minutes: number): boolean {
  return Number.isInteger(minutes) && minutes >= MIN_RADIUS_MINUTES && minutes <= MAX_RADIUS_MINUTES;
}

export function clampRadius(minutes: number): number {
  return Math.min(MAX_RADIUS_MINUTES, Math.max(MIN_RADIUS_MINUTES, Math.round(minutes)));
}

/** Next radius the empty state offers, or null when the platform limit was reached (CA-03.3). */
export function widerRadius(minutes: number): number | null {
  return minutes >= MAX_RADIUS_MINUTES ? null : Math.min(MAX_RADIUS_MINUTES, minutes + RADIUS_STEP_MINUTES);
}
