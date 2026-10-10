import { NearbyOffer, NearbyOfferPage } from '../domain/model/nearby-offer';

/** Test data: an offer of the nearby search with every field, overridable. */
export function nearbyOffer(overrides: Partial<NearbyOffer> = {}): NearbyOffer {
  return {
    offerId: 1052,
    title: '2x1 en almuerzos ejecutivos',
    businessId: 84,
    businessName: 'Restaurante Don Pepe',
    verifiedSeal: true,
    distanceMeters: 350,
    walkMinutes: 5,
    category: 'Gastronomía',
    address: 'Av. Larco 345, Miraflores',
    imageUrl: 'https://images.unsplash.com/photo-1?w=800',
    location: { latitude: -12.1211, longitude: -77.0297 },
    price: 15,
    validTo: '2099-10-15',
    ...overrides,
  };
}

export function pageOf(offers: NearbyOffer[], page = 0, totalPages = 1, totalElements = offers.length): NearbyOfferPage {
  return { offers, page, totalElements, totalPages };
}
