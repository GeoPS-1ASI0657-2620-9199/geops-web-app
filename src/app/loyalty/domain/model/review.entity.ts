import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * domain entity for a comment
 */
export interface Review extends BaseEntity {
  offerId: number;
  userId: number;
  userName?: string;
  rating: number;
  text: string;
  likes: number;
  createdAt: string;
}
