import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Review Entity
 *
 * Represents a review/comment for an offer in the domain layer.
 * This entity manages user feedback including ratings, text comments, and likes.
 */
export interface Review extends BaseEntity {
  /**
   * The ID of the offer being reviewed
   */
  offerId: number;

  /**
   * The ID of the user who created the review
   */
  userId: number;

  /**
   * The name of the user who created the review
   */
  userName: string;

  /**
   * Rating given to the offer (1-5 scale)
   */
  rating: number;

  /**
   * Review text content (maximum 2000 characters)
   */
  text: string;

  /**
   * Number of likes this review has received
   */
  likes: number;

  /**
   * Timestamp when the review was created
   */
  createdAt: string;

  /**
   * Timestamp when the review was last updated
   */
  updatedAt: string;
}
