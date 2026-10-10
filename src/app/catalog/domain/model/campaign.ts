import { GeoPoint, isValidGeoPoint } from '../../../shared/domain/geo-point';

/** Radius of a campaign zone, team decision of BRD-05 RF-03. */
export const MIN_ZONE_RADIUS_METERS = 400;
export const MAX_ZONE_RADIUS_METERS = 5000;
export const DEFAULT_ZONE_RADIUS_METERS = 800;

/** Same codes catalog-service answers (BRD-05 §7.1), so the screen handles both alike. */
export type CampaignRuleViolation =
  | 'CAMPAIGN_ALREADY_ENDED'
  | 'INVALID_CAMPAIGN_PERIOD'
  | 'INVALID_CAMPAIGN_ZONE'
  | 'OFFER_VALIDITY_OUTSIDE_CAMPAIGN'
  | 'CAMPAIGN_WITHOUT_OFFERS'
  | 'INVALID_STORE_LOCATION';

/** Who sees the campaign (US06): a radius around a point or a Lima district with its center. */
export type CampaignZone =
  | { readonly type: 'RADIUS'; readonly center: GeoPoint; readonly radiusMeters: number }
  | { readonly type: 'DISTRICT'; readonly district: string; readonly center: GeoPoint };

/** An offer published with the campaign. Dates are ISO days (yyyy-mm-dd). */
export interface OfferDraft {
  readonly title: string;
  readonly conditions: string;
  readonly price: number;
  readonly validTo: string;
  readonly category: string;
  /** Public link to a photo of the product; optional (Catalog allows up to 500 characters). */
  readonly imageUrl?: string | null;
}

/**
 * A campaign as the owner fills it in (US05). Its business id comes from the token. The business
 * name travels with it until Catalog receives BusinessRegistered (US33), BRD-05 decision DG-1.
 */
export interface CampaignDraft {
  readonly businessName: string;
  readonly name: string;
  readonly description: string;
  readonly period: { readonly start: string; readonly end: string };
  /** Soles; Catalog stores only the amount (BRD-05). */
  readonly estimatedBudget: number | null;
  readonly storeLocation: { readonly address: string; readonly point: GeoPoint | null };
  readonly zone: CampaignZone;
  readonly offers: readonly OfferDraft[];
}

export interface CreatedCampaign {
  readonly campaignId: number;
  readonly name: string;
  readonly status: string;
}

/**
 * Rules of BRD-05 RF-02 and RF-03 checked before calling Catalog. ISO dates compare as strings.
 * today is the current day in Lima, the time zone Catalog uses for CA-05.3.
 */
export function firstViolation(draft: CampaignDraft, today: string): CampaignRuleViolation | null {
  if (!isValidGeoPoint(draft.storeLocation.point)) {
    return 'INVALID_STORE_LOCATION';
  }
  if (draft.period.end < today) {
    return 'CAMPAIGN_ALREADY_ENDED';
  }
  if (draft.period.end < draft.period.start) {
    return 'INVALID_CAMPAIGN_PERIOD';
  }
  if (!isValidZone(draft.zone)) {
    return 'INVALID_CAMPAIGN_ZONE';
  }
  if (draft.offers.length === 0) {
    return 'CAMPAIGN_WITHOUT_OFFERS';
  }
  const outside = draft.offers.some(
    (offer) => offer.validTo < draft.period.start || offer.validTo > draft.period.end,
  );
  return outside ? 'OFFER_VALIDITY_OUTSIDE_CAMPAIGN' : null;
}

function isValidZone(zone: CampaignZone): boolean {
  if (!isValidGeoPoint(zone.center)) {
    return false;
  }
  return zone.type === 'DISTRICT'
    ? zone.district.trim().length > 0
    : zone.radiusMeters >= MIN_ZONE_RADIUS_METERS && zone.radiusMeters <= MAX_ZONE_RADIUS_METERS;
}

/** Calendar day in Lima as yyyy-mm-dd. */
export function todayInLima(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(now);
}

/** Same values as CampaignStatus in catalog-service. */
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'FINISHED';

/** An offer of a published campaign, as GET /campaigns/{id}/offers returns it. */
export interface CampaignOffer {
  readonly offerId: number;
  readonly title: string;
  readonly price: number;
  readonly validTo: string;
  readonly category: string;
  readonly imageUrl: string | null;
  readonly status: string;
}

/** A campaign the owner already published (GET /campaigns), with its offers. */
export interface PublishedCampaign {
  readonly campaignId: number;
  readonly name: string;
  readonly description: string;
  readonly period: { readonly start: string; readonly end: string };
  readonly zone: CampaignZone;
  readonly status: CampaignStatus;
  readonly offers: readonly CampaignOffer[];
}

/** Campaigns by status, the summary under "Mis campañas" (Figma screen 12). */
export function countByStatus(campaigns: readonly PublishedCampaign[]): Record<CampaignStatus, number> {
  const counts: Record<CampaignStatus, number> = { ACTIVE: 0, PAUSED: 0, FINISHED: 0 };
  campaigns.forEach((campaign) => counts[campaign.status]++);
  return counts;
}
