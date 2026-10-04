import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, forkJoin, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Review } from '../domain/model/review.entity';
import {
  ReviewResource,
  ReviewResponse,
  CreateReviewResource,
  UpdateReviewResource
} from './review-response';
import { ReviewAssembler } from './review-assembler';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../identity/infrastructure/auth/auth.service';

/**
 * Review API Endpoint
 *
 * Handles HTTP requests to the Reviews API.
 * Provides methods for CRUD operations on reviews.
 */
@Injectable({
  providedIn: 'root'
})
export class ReviewApiEndpoint extends BaseApiEndpoint<
  Review,
  ReviewResource,
  ReviewResponse,
  ReviewAssembler
> {
  private readonly authService = inject(AuthService);

  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}/reviews`,
      new ReviewAssembler()
    );
  }

  /**
   * Override getAll() to use the filtered getAllOffers() method
   */
  override getAll(): Observable<Review[]> {
    return this.getAllOffers();
  }

  /**
   * Get all reviews filtered by user's campaigns.
   *
   * This method performs cross-bounded-context filtering:
   * 1. Gets the current logged-in user ID
   * 2. Gets all campaigns owned by the user
   * 3. Gets all offers from those campaigns
   * 4. Gets all reviews and filters by the offer IDs
   *
   * Backend returns array directly, not wrapped in response object
   */
  getAllOffers(): Observable<Review[]> {
    // Get current user ID
    const userId = this.authService.getCurrentUserId();

    if (!userId) {
      console.warn('[ReviewApiEndpoint] No user logged in, returning empty reviews');
      return of([]);
    }

    // Step 1: Get user's campaigns
    const campaignsUrl = `${
      environment.platformProviderApiBaseUrl
    }/campaigns/user/${encodeURIComponent(userId)}/campaigns`;

    return this.http.get<any[]>(campaignsUrl).pipe(
      switchMap((campaigns) => {
        if (!campaigns || campaigns.length === 0) {
          return of([]);
        }

        // Step 2: Get all offers for each campaign
        const offerRequests = campaigns.map((campaign) =>
          this.http.get<any[]>(
            `${environment.platformProviderApiBaseUrl}/offers/campaign/${campaign.id}`
          ).pipe(
            catchError(err => {
              console.warn('[ReviewApiEndpoint] Error fetching offers for campaign:', campaign.id, err);
              return of([]);
            })
          )
        );

        return forkJoin(offerRequests).pipe(
          map((offersArrays) => {
            // Flatten the arrays of offers
            const allOffers = offersArrays.flat();
            return allOffers.map((offer) => offer.id);
          })
        );
      }),
      switchMap((offerIds) => {
        if (!offerIds || offerIds.length === 0) {
          return of([]);
        }

        // Step 3: Get all reviews and filter by offer IDs
        return this.http.get<ReviewResource[]>(this.endpointUrl).pipe(
          map(resources => {
            if (!resources) return [];

            let allReviews: Review[] = [];

            // Handle both array and wrapped responses
            if (Array.isArray(resources)) {
              allReviews = resources.map(r => this.assembler.toEntityFromResource(r));
            } else {
              // If wrapped in data property (fallback)
              const wrapped = resources as any;
              if (wrapped.data && Array.isArray(wrapped.data)) {
                allReviews = wrapped.data.map((r: ReviewResource) => this.assembler.toEntityFromResource(r));
              }
            }

            // Filter reviews by offer IDs
            const filtered = allReviews.filter(review => offerIds.includes(review.offerId));

            return filtered;
          })
        );
      }),
      catchError(error => {
        console.error('[ReviewApiEndpoint] Error fetching reviews by user campaigns:', error);
        return of([]);
      })
    );
  }

  /**
   * Get all reviews for a specific offer (filtered client-side)
   */
  getByOfferId(offerId: number): Observable<Review[]> {
    return this.getAll().pipe(
      map(reviews => reviews.filter(r => r.offerId === offerId))
    );
  }

  /**
   * Get all reviews by user ID (filtered client-side)
   */
  getByUserId(userId: number): Observable<Review[]> {
    return this.getAll().pipe(
      map(reviews => reviews.filter(r => r.userId === userId))
    );
  }

  /**
   * Create a new review
   */
  createReview(review: Partial<Review>): Observable<Review> {
    const resource = this.assembler.toCreateResource(review);
    return this.http
      .post<ReviewResource>(this.endpointUrl, resource)
      .pipe(
        map(r => this.assembler.toEntityFromResource(r)),
        catchError(error => {
          console.error('[ReviewApiEndpoint] Error creating review:', error);
          throw error;
        })
      );
  }

  /**
   * Update an existing review (PATCH)
   */
  updateReview(id: number, review: Partial<Review>): Observable<Review> {
    const resource = this.assembler.toUpdateResource(review);
    return this.http
      .patch<ReviewResource>(`${this.endpointUrl}/${id}`, resource)
      .pipe(
        map(r => this.assembler.toEntityFromResource(r)),
        catchError(error => {
          console.error('[ReviewApiEndpoint] Error updating review:', error);
          throw error;
        })
      );
  }

  /**
   * Delete a review
   */
  deleteReview(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${id}`)
      .pipe(
        catchError(error => {
          console.error('[ReviewApiEndpoint] Error deleting review:', error);
          throw error;
        })
      );
  }
}
