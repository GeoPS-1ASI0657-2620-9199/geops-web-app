import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { SavedBusiness } from '../domain/model/saved-business';
import { SavedBusinessRepository } from '../domain/ports/saved-business.repository';
/** Tolerant reader: an Engagement without the offers of each saved business answers a business with none. */
function withOffers(business: Partial<SavedBusiness>): SavedBusiness {
  const activeOffers = business.activeOffers ?? [];
  return { ...business, activeOffers, activeOffersCount: business.activeOffersCount ?? activeOffers.length } as SavedBusiness;
}

@Injectable()
export class HttpSavedBusinessRepository implements SavedBusinessRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/saved-businesses`;
  async findMine(): Promise<SavedBusiness[]> {
    try {
      const list = await firstValueFrom(this.http.get<Partial<SavedBusiness>[]>(this.url));
      return list.map(withOffers);
    }
    catch (error) { throw toApiError(error); }
  }
  async save(businessId: number): Promise<void> {
    try { await firstValueFrom(this.http.post(this.url, { businessId })); }
    catch (error) { throw toApiError(error); }
  }
  async remove(businessId: number): Promise<void> {
    try { await firstValueFrom(this.http.delete(`${this.url}/${businessId}`)); }
    catch (error) { throw toApiError(error); }
  }
}
