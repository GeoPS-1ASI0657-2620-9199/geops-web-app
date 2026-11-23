import { NearbyOffer } from '../domain/model/nearby-offer';

/** How the buyer orders the offers of the search: nearest, cheapest or ending soonest. */
export type OfferOrder = 'distance' | 'price' | 'expiry';

export const OFFER_ORDERS: readonly OfferOrder[] = ['distance', 'price', 'expiry'];

export function isOfferOrder(value: string | null | undefined): value is OfferOrder {
  return OFFER_ORDERS.includes(value as OfferOrder);
}

/** Sorts a copy; ties are broken by distance, since proximity is what the search is about. */
export function sortOffers(offers: readonly NearbyOffer[], order: OfferOrder): NearbyOffer[] {
  const sorted = [...offers];
  if (order === 'price') {
    sorted.sort((a, b) => a.price - b.price || a.distanceMeters - b.distanceMeters);
  } else if (order === 'expiry') {
    sorted.sort((a, b) => a.validTo.localeCompare(b.validTo) || a.distanceMeters - b.distanceMeters);
  } else {
    sorted.sort((a, b) => a.distanceMeters - b.distanceMeters);
  }
  return sorted;
}
