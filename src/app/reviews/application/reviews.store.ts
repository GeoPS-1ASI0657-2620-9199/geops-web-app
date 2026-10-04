import { Injectable, inject, signal, computed } from '@angular/core';
import { retry } from 'rxjs/operators';

import { Review } from '../domain/model/review.entity';
import { ReviewApiEndpoint } from '../infrastructure/review-api-endpoint';

/**
 * Reviews Store
 *
 * Application layer store for managing review state using Angular Signals
 *
 * @summary Manages review application state and business operations
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewsStore {
  private readonly api = inject(ReviewApiEndpoint);

  // Private signals for state mutation
  private readonly reviewsSignal = signal<Review[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly currentOfferIdSignal = signal<number | null>(null);

  // Public readonly signals
  readonly reviews = this.reviewsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly currentOfferId = this.currentOfferIdSignal.asReadonly();

  // Computed signals for counts and statistics
  readonly reviewsCount = computed(() => this.reviews().length);
  readonly averageRating = computed(() => {
    const reviews = this.reviews();
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  });
  readonly totalLikes = computed(() =>
    this.reviews().reduce((acc, review) => acc + review.likes, 0)
  );

  // Computed signals for filtering by rating
  readonly fiveStarReviews = computed(() =>
    this.reviews().filter(r => r.rating === 5)
  );
  readonly fourStarReviews = computed(() =>
    this.reviews().filter(r => r.rating === 4)
  );
  readonly threeStarReviews = computed(() =>
    this.reviews().filter(r => r.rating === 3)
  );
  readonly twoStarReviews = computed(() =>
    this.reviews().filter(r => r.rating === 2)
  );
  readonly oneStarReviews = computed(() =>
    this.reviews().filter(r => r.rating === 1)
  );

  // Computed signal for rating distribution
  readonly ratingDistribution = computed(() => {
    const total = this.reviewsCount();
    const distribution = [
      { rating: 5, count: this.fiveStarReviews().length, percentage: 0 },
      { rating: 4, count: this.fourStarReviews().length, percentage: 0 },
      { rating: 3, count: this.threeStarReviews().length, percentage: 0 },
      { rating: 2, count: this.twoStarReviews().length, percentage: 0 },
      { rating: 1, count: this.oneStarReviews().length, percentage: 0 },
    ];

    distribution.forEach(item => {
      item.percentage = total > 0 ? (item.count / total) * 100 : 0;
    });

    return distribution;
  });

  // Computed signal for statistics
  readonly statistics = computed(() => ({
    total: this.reviewsCount(),
    averageRating: this.averageRating(),
    totalLikes: this.totalLikes(),
    ratingDistribution: this.ratingDistribution()
  }));

  /**
   * Load all reviews filtered by user's campaigns
   */
  loadAllReviews(): void {
    this.currentOfferIdSignal.set(null);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getAll()
      .pipe(retry(2))
      .subscribe({
        next: (reviews) => {
          this.reviewsSignal.set(reviews);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error loading reviews';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[ReviewsStore] Error loading reviews:', err);
        }
      });
  }

  /**
   * Load reviews for a specific offer
   * @param offerId - The offer ID
   */
  loadReviewsByOfferId(offerId: number): void {
    this.currentOfferIdSignal.set(offerId);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getByOfferId(offerId)
      .pipe(retry(2))
      .subscribe({
        next: (reviews) => {
          this.reviewsSignal.set(reviews);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error loading reviews for offer';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[ReviewsStore] Error loading reviews by offer:', err);
        }
      });
  }

  /**
   * Create a new review
   * @param review - The review data without ID
   */
  createReview(review: Omit<Review, 'id'>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.createReview(review as Review)
      .pipe(retry(2))
      .subscribe({
        next: (createdReview) => {
          // Add the new review to the local state
          this.reviewsSignal.update(reviews => [...reviews, createdReview]);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error creating review';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[ReviewsStore] Error creating review:', err);
        }
      });
  }

  /**
   * Filter reviews by minimum rating
   * @param minRating - Minimum rating (1-5)
   * @returns Filtered reviews
   */
  filterByRating(minRating: number): Review[] {
    return this.reviews().filter(review => review.rating >= minRating);
  }

  /**
   * Sort reviews by criteria
   * @param reviews - Reviews to sort
   * @param sortBy - Sort criteria
   * @returns Sorted reviews
   */
  sortReviews(reviews: Review[], sortBy: 'date' | 'rating' | 'likes'): Review[] {
    const sorted = [...reviews];

    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'rating':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'likes':
        return sorted.sort((a, b) => b.likes - a.likes);
      default:
        return sorted;
    }
  }

  /**
   * Get reviews by user ID from current state
   * @param userId - The user ID
   * @returns Reviews by user
   */
  getReviewsByUserId(userId: number): Review[] {
    return this.reviews().filter(r => r.userId === userId);
  }

  /**
   * Get review by ID from current state
   * @param reviewId - The review ID
   * @returns The review or undefined
   */
  getReviewById(reviewId: number): Review | undefined {
    return this.reviews().find(r => r.id === reviewId);
  }

  /**
   * Clear all reviews from state
   */
  clearState(): void {
    this.reviewsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.currentOfferIdSignal.set(null);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
