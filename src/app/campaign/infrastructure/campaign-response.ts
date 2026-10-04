/**
 * Campaign API Response Types
 *
 * Defines the structure of responses from the Campaign API endpoints.
 * These mirror the backend CampaignResource structure.
 */

/**
 * Campaign Resource from API
 */
export interface CampaignResource {
  id: number;
  userId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  estimatedBudget: number;
  totalImpressions: number;
  totalClicks: number;
  CTR: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Campaign Resource (request payload)
 */
export interface CreateCampaignResource {
  userId: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  estimatedBudget: number;
}

/**
 * Update Campaign Resource (request payload)
 * Backend requires all mandatory fields in PATCH request
 */
export interface UpdateCampaignResource {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: string;
  estimatedBudget: number;
  // Optional metrics fields
  totalImpressions?: number;
  totalClicks?: number;
  ctr?: number;
}

/**
 * Campaign API Response wrapper
 */
export interface CampaignResponse {
  data: CampaignResource | CampaignResource[];
  message?: string;
  status?: number;
}

/**
 * Offer Resource from API (simplified for campaign context)
 */
export interface OfferResource {
  id: number;
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
  validTo?: string;
  codePrefix?: string;
  createdAt: string;
  updatedAt: string;
  rating: number;
}

/**
 * Create Offer Resource (request payload)
 */
export interface CreateOfferResource {
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
  validTo?: string;
  codePrefix?: string;
  rating?: number;
}

/**
 * Update Offer Resource (request payload)
 */
export interface UpdateOfferResource {
  title?: string;
  partner?: string;
  price?: number;
  originalPrice?: number;
  description?: string;
  category?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  validTo?: string;
  codePrefix?: string;
}

/**
 * Offer API Response wrapper
 */
export interface OfferResponse {
  data: OfferResource | OfferResource[];
  message?: string;
  status?: number;
}
