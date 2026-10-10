import { NearbyOffer, NearbyOfferPage } from '../domain/model/nearby-offer';
import { OfferDetail, OfferSource } from '../domain/model/offer-detail';

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
  address?: string | null;
  imageUrl?: string | null;
  latitude: number;
  longitude: number;
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
    address: offer.address ?? '',
    imageUrl: offer.imageUrl ?? null,
    location: { latitude: offer.latitude, longitude: offer.longitude },
    price: offer.price,
    validTo: offer.validTo,
  };
}

/** Body of GET /api/v1/offers/{id} (BRD-05 §7.2). */
export interface OfferDetailResponse {
  offerId: number;
  title: string;
  conditions: string;
  price: number;
  validTo: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  imageUrl?: string | null;
  source: OfferSource;
  businessId: number | null;
  businessName: string;
  verifiedSeal: boolean;
  available: boolean;
}

export function toOfferDetail(response: OfferDetailResponse): OfferDetail {
  return {
    offerId: response.offerId,
    title: response.title,
    conditions: response.conditions,
    price: response.price,
    validTo: response.validTo,
    category: response.category,
    address: response.address,
    location: { latitude: response.latitude, longitude: response.longitude },
    imageUrl: response.imageUrl ?? null,
    source: response.source,
    businessId: response.businessId,
    businessName: response.businessName,
    verifiedSeal: response.verifiedSeal,
    available: response.available,
  };
}
