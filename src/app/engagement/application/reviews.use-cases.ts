import { Injectable, inject } from '@angular/core';
import { ReviewInput } from '../domain/model/review';
import { ReviewRepository } from '../domain/ports/review.repository';
@Injectable({ providedIn: 'root' })
export class ListBusinessReviewsUseCase {
  private readonly repository = inject(ReviewRepository);
  execute(businessId: number) { return this.repository.findByBusiness(businessId); }
}
@Injectable({ providedIn: 'root' })
export class CreateReviewUseCase {
  private readonly repository = inject(ReviewRepository);
  execute(input: ReviewInput) { return this.repository.create(input); }
}
@Injectable({ providedIn: 'root' })
export class ReplyToReviewUseCase {
  private readonly repository = inject(ReviewRepository);
  execute(reviewId: number, text: string) { return this.repository.reply(reviewId, text); }
}
