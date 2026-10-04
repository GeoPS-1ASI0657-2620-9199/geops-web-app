import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Campaign Domain Entity
 *
 * Represents a marketing campaign in the GeoPs platform.
 * Campaigns are owned by users (Owner role) and contain multiple offers.
 * Tracks campaign performance metrics like impressions, clicks, and CTR.
 *
 * @property userId - ID of the user (Owner) who created the campaign
 * @property name - Name of the campaign
 * @property description - Description of the campaign
 * @property startDate - Campaign start date (ISO string)
 * @property endDate - Campaign end date (ISO string)
 * @property status - Campaign status: 'ACTIVE', 'PAUSED', 'FINALIZED'
 * @property estimatedBudget - Estimated budget for the campaign
 * @property totalImpressions - Total number of impressions
 * @property totalClicks - Total number of clicks
 * @property ctr - Click-through rate (CTR)
 * @property createdAt - ISO timestamp when created
 * @property updatedAt - ISO timestamp when last updated
 */
export interface Campaign extends BaseEntity {
  userId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  estimatedBudget: number;
  totalImpressions: number;
  totalClicks: number;
  CTR: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Campaign status enum
 */
export type CampaignStatus = 'ACTIVE' | 'PAUSED' | 'FINALIZED';
