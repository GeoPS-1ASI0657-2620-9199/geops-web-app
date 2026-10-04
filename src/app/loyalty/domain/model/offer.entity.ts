import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * domain entity for an offer
 */
export interface Offer extends BaseEntity {
  id: number;
  campaignId: number;
  title: string;
  partner: string;
  price: number;
  codePrefix: string;
  validUntil: string;
  rating: number;
  location: string;
  category: string;
  imageUrl?: string;
}
