import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Review } from '../domain/model/review.entity';
import { ReviewResource, ReviewsResponse } from './reviews-response';
import { ReviewsAssembler } from './reviews-assembler';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReviewsApiEndpoint extends BaseApiEndpoint<
  Review,
  ReviewResource,
  ReviewsResponse,
  ReviewsAssembler
> {
  /**
   * creates an instance of the reviewsApiEndpoint service
   * @param http - angular http client
   */
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}/reviews`, new ReviewsAssembler());
  }

  /**
   * get reviews of an offer
   * @param offerId
   */
  listByOffer(offerId: number): Observable<Review[]> {
    const url = `${this.endpointUrl}?offerId=${offerId}&_sort=createdAt&_order=desc`;
    return this.http
      .get<ReviewResource[]>(url)
      .pipe(map(list => list.map(r => this.assembler.toEntityFromResource(r))));
  }

  /**
   * create a new review for an offer
   * @param review
   */
  add(review: Omit<Review, 'id' | 'likes' | 'createdAt'>): Observable<Review> {
    const body: ReviewResource = {
      ...review,
      likes: 0,
      createdAt: new Date().toISOString(),
    } as any;

    return this.http
      .post<ReviewResource>(this.endpointUrl, body)
      .pipe(map(r => this.assembler.toEntityFromResource(r)));
  }

  /**
   * update the number of likes on a review
   * @param id - reviewID
   * @param nextLikes - new likes value
   */
  like(id: number, nextLikes: number): Observable<Review> {
    return this.http
      .patch<ReviewResource>(`${this.endpointUrl}/${id}`, { likes: nextLikes })
      .pipe(map(r => this.assembler.toEntityFromResource(r)));
  }
}
