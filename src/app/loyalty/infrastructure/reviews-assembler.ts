import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Review } from '../domain/model/review.entity';
import { ReviewResource, ReviewsResponse } from './reviews-response';

export class ReviewsAssembler
  implements BaseAssembler<Review, ReviewResource, ReviewsResponse>
{
  /**
   * converts data between the infrastructure layer and the domain
   * @param r - review resource received from the API
   */
  toEntityFromResource(r: ReviewResource): Review {
    return {
      ...r,
      id: Number(r.id),
      offerId: Number(r.offerId),
      userId: Number(r.userId),
      rating: Number(r.rating),
      likes: Number(r.likes),
    };
  }

  /**
   * converts a domain entity
   * @param e - entity review
   */
  toResourceFromEntity(e: Review): ReviewResource {
    return { ...e };
  }

  /**
   * converts a complete API response
   * @param _resp - API response
   */
  toEntitiesFromResponse(_resp: ReviewsResponse): Review[] {
    return [];
  }
}
