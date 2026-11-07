import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { FollowedBusiness } from '../domain/model/followed-business';
import { FollowRepository } from '../domain/ports/follow.repository';

@Injectable()
export class HttpFollowRepository implements FollowRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/follows`;

  async findMine(): Promise<FollowedBusiness[]> {
    try { return await firstValueFrom(this.http.get<FollowedBusiness[]>(this.url)); }
    catch (error) { throw toApiError(error); }
  }

  async follow(businessId: number): Promise<FollowedBusiness> {
    try { return await firstValueFrom(this.http.post<FollowedBusiness>(this.url, { businessId })); }
    catch (error) { throw toApiError(error); }
  }

  async unfollow(businessId: number): Promise<void> {
    try { await firstValueFrom(this.http.delete(`${this.url}/${businessId}`)); }
    catch (error) { throw toApiError(error); }
  }
}
