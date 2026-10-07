import { GeoPoint } from '../../../shared/domain/geo-point';
import { NearbyOfferPage } from '../model/nearby-offer';
import { OfferDetail } from '../model/offer-detail';

/** Port to the offers of Catalog. Implementations reject with ApiError. */
export abstract class OfferRepository {
  abstract findNearby(origin: GeoPoint, radiusMinutes: number, page: number): Promise<NearbyOfferPage>;
  /** Rejects with OFFER_NOT_FOUND when the offer does not exist. */
  abstract findById(offerId: number): Promise<OfferDetail>;
}
