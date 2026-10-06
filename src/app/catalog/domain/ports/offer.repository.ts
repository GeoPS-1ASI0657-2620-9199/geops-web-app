import { GeoPoint } from '../../../shared/domain/geo-point';
import { NearbyOfferPage } from '../model/nearby-offer';

/** Port to the offers of Catalog. Implementations reject with ApiError. */
export abstract class OfferRepository {
  abstract findNearby(origin: GeoPoint, radiusMinutes: number, page: number): Promise<NearbyOfferPage>;
}
