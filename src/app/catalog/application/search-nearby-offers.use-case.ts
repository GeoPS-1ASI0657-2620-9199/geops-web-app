import { Injectable, inject } from '@angular/core';
import { GeoPoint } from '../../shared/domain/geo-point';
import { NearbyOfferPage, clampRadius } from '../domain/model/nearby-offer';
import { OfferRepository } from '../domain/ports/offer.repository';

/**
 * Valid offers around a point within a walking radius, in the order Catalog decides (Informe
 * 4.3.2.5). The web never reorders them.
 */
@Injectable({ providedIn: 'root' })
export class SearchNearbyOffersUseCase {
  private readonly offers = inject(OfferRepository);

  execute(origin: GeoPoint, radiusMinutes: number, page = 0): Promise<NearbyOfferPage> {
    return this.offers.findNearby(origin, clampRadius(radiusMinutes), Math.max(0, page));
  }
}
