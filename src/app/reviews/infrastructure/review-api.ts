import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Review } from '../domain/model/review.entity';
import { ReviewApiEndpoint } from './review-api-endpoint';

/**
 * Review API Service
 *
 * Infrastructure service for managing review data and state.
 * Provides reactive state management using BehaviorSubjects.
 */
@Injectable({ providedIn: 'root' })
export class ReviewApi extends BaseApi {
  private readonly endpoint: ReviewApiEndpoint;
  private reviewsSubject = new BehaviorSubject<Review[]>([]);
  public reviews$ = this.reviewsSubject.asObservable();

  constructor(private http: HttpClient) {
    super();
    this.endpoint = new ReviewApiEndpoint(http);
  }

  /**
   * Get all reviews filtered by user's campaigns.
   * This now automatically filters by the logged-in user's campaign offers.
   */
  getAllReviews(): Observable<Review[]> {
    return this.endpoint
      .getAll()
      .pipe(tap((reviews: Review[]) => this.reviewsSubject.next(reviews)));
  }

  getReviewsByOfferId(offerId: number): Observable<Review[]> {
    return this.endpoint.getByOfferId(offerId).pipe(
      tap((reviews: Review[]) => this.reviewsSubject.next(reviews))
    );
  }

  getReviewsByUserId(userId: number): Observable<Review[]> {
    return this.endpoint.getAll().pipe(
      map((reviews: Review[]) => reviews.filter((r) => r.userId === userId)),
      tap((filtered) => this.reviewsSubject.next(filtered))
    );
  }

  createReview(review: Omit<Review, 'id'>): Observable<Review> {
    return this.endpoint
      .createReview(review as Review)
      .pipe(tap((r) => this.reviewsSubject.next([...this.reviewsSubject.value, r])));
  }
}
