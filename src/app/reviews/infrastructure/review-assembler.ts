import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Review } from '../domain/model/review.entity';
import {
  ReviewResource,
  ReviewResponse,
  CreateReviewResource,
  UpdateReviewResource
} from './review-response';

/**
 * Review Assembler
 *
 * Converts between Review entities and API resources.
 * Implements the BaseAssembler interface for type safety.
 */
export class ReviewAssembler implements BaseAssembler<Review, ReviewResource, ReviewResponse> {

  /**
   * Converts API resource to domain entity
   */
  toEntityFromResource(resource: ReviewResource): Review {
    return {
      id: resource.id,
      offerId: resource.offerId,
      userId: resource.userId,
      userName: resource.userName,
      rating: resource.rating,
      text: resource.text,
      likes: resource.likes,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt
    };
  }

  /**
   * Converts domain entity to API resource
   */
  toResourceFromEntity(entity: Review): ReviewResource {
    return {
      id: entity.id,
      offerId: entity.offerId,
      userId: entity.userId,
      userName: entity.userName,
      rating: entity.rating,
      text: entity.text,
      likes: entity.likes,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Converts API response to array of domain entities
   */
  toEntitiesFromResponse(response: ReviewResponse): Review[] {
    if (!Array.isArray(response.data)) {
      return [this.toEntityFromResource(response.data)];
    }
    return response.data.map(resource => this.toEntityFromResource(resource));
  }

  /**
   * Converts create command to API resource
   */
  toCreateResource(entity: Partial<Review>): CreateReviewResource {
    return {
      offerId: entity.offerId!,
      userId: entity.userId!,
      userName: entity.userName!,
      rating: entity.rating!,
      text: entity.text!
    };
  }

  /**
   * Converts update command to API resource
   */
  toUpdateResource(entity: Partial<Review>): UpdateReviewResource {
    const resource: UpdateReviewResource = {};

    if (entity.rating !== undefined) resource.rating = entity.rating;
    if (entity.text !== undefined) resource.text = entity.text;

    return resource;
  }
}
