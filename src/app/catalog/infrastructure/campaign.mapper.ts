import { CampaignDraft, CreatedCampaign } from '../domain/model/campaign';

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
  offers: { title: string; conditions: string; price: number; validTo: string; category: string }[];
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
    })),
  };
}

export function toCreatedCampaign(response: CreatedCampaignResponse): CreatedCampaign {
  return { campaignId: response.campaignId, name: response.name, status: response.status };
}
