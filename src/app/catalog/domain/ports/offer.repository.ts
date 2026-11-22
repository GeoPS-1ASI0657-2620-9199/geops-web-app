import { GeoPoint } from '../../../shared/domain/geo-point';
import { NearbyOfferPage } from '../model/nearby-offer';
import { OfferDetail } from '../model/offer-detail';
import { PublicSourceOffer } from '../model/public-source-offer';

/** Port to the offers of Catalog. Implementations reject with ApiError. */
export abstract class OfferRepository {
  /**
   * category is one of categories(); null brings every category (US08). term is the text of the top
   * bar search, already normalized with searchTermOf(); Catalog applies it before paging, so
   * totalElements counts only the matches. null searches without text.
   */
  abstract findNearby(
    origin: GeoPoint,
    radiusMinutes: number,
    page: number,
    category?: string | null,
    term?: string | null,
  ): Promise<NearbyOfferPage>;
  /**
   * The first page of offers of public sources around the same point and radius, in their own query
   * so they never mix with the affiliated ones (US39, E2-08).
   */
  abstract findPublicSourcesNearby(
    origin: GeoPoint,
    radiusMinutes: number,
    category?: string | null,
  ): Promise<PublicSourceOffer[]>;
  /** The closed list of categories Catalog accepts (E2-06), in its order. */
  abstract categories(): Promise<string[]>;
  /**
   * Rejects with OFFER_NOT_FOUND when the offer does not exist. trackClick counts the visit as a click
   * on the offer for the metrics of its campaign; only the detail a buyer opens sends it, never a
   * screen that reads the offer for another reason (a reservation, the favorites).
   */
  abstract findById(offerId: number, options?: { readonly trackClick?: boolean }): Promise<OfferDetail>;
}
