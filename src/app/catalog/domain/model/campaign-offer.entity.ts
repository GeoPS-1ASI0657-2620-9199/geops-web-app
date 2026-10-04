import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Offer Domain Entity (Campaign Context)
 *
 * Represents an offer associated with a campaign.
 * This is a simplified view focused on campaign management.
 *
 * @property campaignId - ID of the parent campaign
 * @property title - Offer title
 * @property partner - Partner company name
 * @property price - Current price
 * @property originalPrice - Original price before discount
 * @property description - Offer description
 * @property category - Offer category
 * @property location - Location of the offer
 * @property latitude - Geographic latitude
 * @property longitude - Geographic longitude
 * @property imageUrl - URL of offer image
 * @property validUntil - Valid until date (ISO string)
 * @property codePrefix - Prefix for coupon codes
 * @property createdAt - ISO timestamp when created
 * @property updatedAt - ISO timestamp when last updated
 */
export interface CampaignOffer extends BaseEntity {
  campaignId: number;
  title: string;
  partner: string;
  price: number;
  originalPrice?: number;
  description?: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  validUntil?: string;
  codePrefix?: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
}
