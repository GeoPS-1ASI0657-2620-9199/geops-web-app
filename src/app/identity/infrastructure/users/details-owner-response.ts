/**
 * DetailsOwner resource returned by API.
 * Matches the backend DetailsOwnerResource structure.
 */
export interface DetailsOwnerResource {
  id: number;
  userId: number;
  businessName: string;
  businessType?: string;
  taxId?: string;
  website?: string;
  description?: string;
  address?: string;
  horarioAtencion?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Request resource for creating owner details.
 */
export interface CreateDetailsOwnerResource {
  businessName: string;
  businessType?: string;
  taxId?: string;
  website?: string;
  description?: string;
  address?: string;
  horarioAtencion?: string;
}

/**
 * API response for owner details.
 */
export interface DetailsOwnerResponse {}

