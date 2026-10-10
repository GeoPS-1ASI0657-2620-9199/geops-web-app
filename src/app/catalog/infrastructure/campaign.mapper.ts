import {
  CampaignDraft,
  CampaignOffer,
  CampaignStatus,
  CreatedCampaign,
  PublishedCampaign,
} from '../domain/model/campaign';

const CURRENCY = 'PEN';

/** Body of POST /api/v1/campaigns (BRD-05 §7.3). */
export interface CreateCampaignRequest {
  businessName: string;
  name: string;
  description: string;
  period: { start: string; end: string };
  estimatedBudget?: { amount: number; currency: string };
  storeLocation: { address: string; latitude: number; longitude: number };
  zone:
    | { type: 'RADIUS'; center: { latitude: number; longitude: number }; radiusMeters: number }
    | { type: 'DISTRICT'; district: string; center: { latitude: number; longitude: number } };
  offers: { title: string; conditions: string; price: number; validTo: string; category: string; imageUrl?: string }[];
}

/** Body of the 201 answer. */
export interface CreatedCampaignResponse {
  campaignId: number;
  businessId: number;
  name: string;
  status: string;
}

export function toCreateCampaignRequest(draft: CampaignDraft): CreateCampaignRequest {
  const point = draft.storeLocation.point!;
  const zone = draft.zone;
  return {
    businessName: draft.businessName,
    name: draft.name,
    description: draft.description,
    period: { start: draft.period.start, end: draft.period.end },
    ...(draft.estimatedBudget !== null
      ? { estimatedBudget: { amount: draft.estimatedBudget, currency: CURRENCY } }
      : {}),
    storeLocation: {
      address: draft.storeLocation.address,
      latitude: point.latitude,
      longitude: point.longitude,
    },
    zone:
      zone.type === 'RADIUS'
        ? { type: 'RADIUS', center: { ...zone.center }, radiusMeters: zone.radiusMeters }
        : { type: 'DISTRICT', district: zone.district, center: { ...zone.center } },
    offers: draft.offers.map((offer) => ({
      title: offer.title,
      conditions: offer.conditions,
      price: offer.price,
      validTo: offer.validTo,
      category: offer.category,
      ...(offer.imageUrl ? { imageUrl: offer.imageUrl } : {}),
    })),
  };
}

export function toCreatedCampaign(response: CreatedCampaignResponse): CreatedCampaign {
  return { campaignId: response.campaignId, name: response.name, status: response.status };
}

/** Body of each item of GET /api/v1/campaigns (catalog-service CampaignResponse). */
export interface CampaignResponse {
  campaignId: number;
  name: string;
  description: string | null;
  period: { start: string; end: string };
  zone: {
    type: 'RADIUS' | 'DISTRICT';
    center: { latitude: number; longitude: number };
    radiusMeters: number | null;
    district: string | null;
  };
  status: CampaignStatus;
}

/** Body of each item of GET /api/v1/campaigns/{id}/offers (catalog-service OfferResponse). */
export interface CampaignOfferResponse {
  offerId: number;
  title: string;
  price: number;
  validTo: string;
  category: string;
  imageUrl: string | null;
  status: string;
}

export function toPublishedCampaign(response: CampaignResponse): Omit<PublishedCampaign, 'offers'> {
  const center = response.zone.center;
  return {
    campaignId: response.campaignId,
    name: response.name,
    description: response.description ?? '',
    period: response.period,
    zone:
      response.zone.type === 'DISTRICT'
        ? { type: 'DISTRICT', district: response.zone.district ?? '', center }
        : { type: 'RADIUS', center, radiusMeters: response.zone.radiusMeters ?? 0 },
    status: response.status,
  };
}

export function toCampaignOffer(response: CampaignOfferResponse): CampaignOffer {
  return {
    offerId: response.offerId,
    title: response.title,
    price: response.price,
    validTo: response.validTo,
    category: response.category,
    imageUrl: response.imageUrl ?? null,
    status: response.status,
  };
}
