import { MapPin } from '../../shared/ui/geo-offers-map/geo-offers-map';
import { categoryIcon } from '../../shared/ui/category-icon';
import { SearchOrigin } from '../application/offer-search.store';
import { NearbyOffer } from '../domain/model/nearby-offer';

/** Walking speed Catalog uses to turn minutes into meters (WalkingRadius in catalog-service). */
export const METERS_PER_WALK_MINUTE = 80;

/** "Jesús María" or "Tu ubicación · ±12 m", the chip of the "Lugares" row. */
export function placeLabelOf(origin: SearchOrigin | null): string {
  if (!origin) {
    return '';
  }
  return origin.districtName ?? `Tu ubicación · ±${origin.accuracyMeters ?? 0} m`;
}

/** Label at the bottom left of the map: the real accuracy, or that the search starts at a district center. */
export function precisionLabelOf(origin: SearchOrigin | null): string | null {
  if (!origin) {
    return null;
  }
  return origin.districtName ? `Centro de ${origin.districtName}` : `Precisión ±${origin.accuracyMeters ?? 0} m`;
}

export function toPins(offers: readonly NearbyOffer[]): MapPin[] {
  return offers.map((offer) => ({
    id: offer.offerId,
    point: offer.location,
    icon: categoryIcon(offer.category),
    label: `${offer.businessName}: ${offer.title}`,
    kind: 'verified',
  }));
}

/** Free-text filter of the top bar search: title, business or category. */
export function matchesTerm(offer: NearbyOffer, term: string): boolean {
  const needle = normalize(term);
  return !needle || [offer.title, offer.businessName, offer.category].some((text) => normalize(text).includes(needle));
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
