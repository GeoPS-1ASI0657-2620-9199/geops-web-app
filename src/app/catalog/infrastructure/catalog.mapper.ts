import { NearbyOffer, NearbyOfferPage } from '../domain/model/nearby-offer';

/** Body of GET /api/v1/offers/nearby (BRD-04 §6, Informe 4.3.2.5). */
export interface NearbyOffersResponse {
  content: NearbyOfferResponse[];
  page: number;
  totalElements: number;
  totalPages: number;
}

export interface NearbyOfferResponse {
  offerId: number;
  title: string;
  businessId: number;
  businessName: string;
  verifiedSeal: boolean;
  distanceMeters: number;
  walkMinutes: number;
  category: string;
  price: number;
  validTo: string;
}

export function toNearbyOfferPage(response: NearbyOffersResponse): NearbyOfferPage {
  return {
    offers: response.content.map(toNearbyOffer),
    page: response.page,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  };
}

function toNearbyOffer(offer: NearbyOfferResponse): NearbyOffer {
  return {
    offerId: offer.offerId,
    title: offer.title,
    businessId: offer.businessId,
    businessName: offer.businessName,
    verifiedSeal: offer.verifiedSeal,
    distanceMeters: offer.distanceMeters,
    walkMinutes: offer.walkMinutes,
    category: offer.category,
    price: offer.price,
    validTo: offer.validTo,
  };
}
