import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Represents the owner-specific details associated with a user.
 * This entity manages business information such as business name, type,
 * tax ID, website, description, address, and operating hours.
 */
export interface DetailsOwner extends BaseEntity {
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

