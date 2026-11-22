import { MapPin } from '../../shared/ui/geo-offers-map/geo-offers-map';
import { categoryIcon } from '../../shared/ui/category-icon';
import { SearchOrigin } from '../application/offer-search.store';
import { NearbyOffer } from '../domain/model/nearby-offer';
import { PublicSourceOffer } from '../domain/model/public-source-offer';

/** Walking speed Catalog uses to turn minutes into meters (WalkingRadius in catalog-service). */
export const METERS_PER_WALK_MINUTE = 80;
/** Below this distance the cards say "Aquí mismo" instead of meters and minutes. */
export const HERE_METERS = 20;

/** Minutes on foot for a distance, at the walking speed of Catalog. */
export function walkMinutesFor(meters: number): number {
  return Math.ceil(meters / METERS_PER_WALK_MINUTE);
}

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

/** Pins of the affiliated offers, plus the amber pins of the public sources (US39). */
export function toPins(offers: readonly NearbyOffer[], publicOffers: readonly PublicSourceOffer[] = []): MapPin[] {
  return [
    ...offers.map<MapPin>((offer) => ({
      id: offer.offerId,
      point: offer.location,
      icon: categoryIcon(offer.category),
      label: `${offer.businessName}: ${offer.title}`,
      kind: 'verified',
    })),
    ...publicOffers.map<MapPin>((offer) => ({
      id: offer.offerId,
      point: offer.location,
      icon: categoryIcon(offer.category),
      label: `${offer.sourceName}: ${offer.title}`,
      kind: 'reference',
    })),
  ];
}

/**
 * The text of the top bar search over a public source offer: title, source or category, ignoring case
 * and accents, as Catalog does with the affiliated offers.
 */
export function publicOfferMatches(offer: PublicSourceOffer, term: string): boolean {
  const needle = normalize(term);
  return !needle || [offer.title, offer.sourceName, offer.category].some((text) => normalize(text ?? '').includes(needle));
}

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
