import { GeoPoint } from '../../../shared/domain/geo-point';
import { NearbyOfferPage } from '../model/nearby-offer';
import { OfferDetail } from '../model/offer-detail';

/** Port to the offers of Catalog. Implementations reject with ApiError. */
export abstract class OfferRepository {
  /** category is one of categories(); null brings every category (US08). */
  abstract findNearby(
    origin: GeoPoint,
    radiusMinutes: number,
    page: number,
    category?: string | null,
  ): Promise<NearbyOfferPage>;
  /** The closed list of categories Catalog accepts (E2-06), in its order. */
  abstract categories(): Promise<string[]>;
  /** Rejects with OFFER_NOT_FOUND when the offer does not exist. */
  abstract findById(offerId: number): Promise<OfferDetail>;
}
