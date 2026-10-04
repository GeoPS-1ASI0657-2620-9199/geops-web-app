import { BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Review Resource
 *
 * Represents the review data structure from the API
 */
export interface ReviewResource {
  id: number;
  offerId: number;
  userId: number;
  userName: string;
  rating: number;
  text: string;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Review Resource
 *
 * Data structure for creating a new review
 */
export interface CreateReviewResource {
  offerId: number;
  userId: number;
  userName: string;
  rating: number;
  text: string;
}

/**
 * Update Review Resource
 *
 * Data structure for updating an existing review
 */
export interface UpdateReviewResource {
  rating?: number;
  text?: string;
}

/**
 * Review Response
 *
 * API response wrapper for review data
 */
export interface ReviewResponse extends BaseResponse {
  data: ReviewResource | ReviewResource[];
}
