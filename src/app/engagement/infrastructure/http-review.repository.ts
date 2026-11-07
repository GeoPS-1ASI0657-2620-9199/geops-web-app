import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { Review, ReviewInput } from '../domain/model/review';
import { ReviewRepository } from '../domain/ports/review.repository';
@Injectable()
export class HttpReviewRepository implements ReviewRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/reviews`;
  async findByBusiness(businessId: number): Promise<Review[]> {
    try { return await firstValueFrom(this.http.get<Review[]>(this.url, { params: { businessId } })); }
    catch (error) { throw toApiError(error); }
  }
  async create(input: ReviewInput): Promise<Review> {
    try { return await firstValueFrom(this.http.post<Review>(this.url, input)); }
    catch (error) { throw toApiError(error); }
  }
  async reply(reviewId: number, text: string): Promise<void> {
    try { await firstValueFrom(this.http.post(`${this.url}/${reviewId}/replies`, { text })); }
    catch (error) { throw toApiError(error); }
  }
}
