import { Review, ReviewInput } from '../model/review';
export abstract class ReviewRepository {
  abstract findByBusiness(businessId: number): Promise<Review[]>;
  abstract create(input: ReviewInput): Promise<Review>;
  abstract reply(reviewId: number, text: string): Promise<void>;
}
