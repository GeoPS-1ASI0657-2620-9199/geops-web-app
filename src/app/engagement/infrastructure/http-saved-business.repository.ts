import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { SavedBusiness } from '../domain/model/saved-business';
import { SavedBusinessRepository } from '../domain/ports/saved-business.repository';
@Injectable()
export class HttpSavedBusinessRepository implements SavedBusinessRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/saved-businesses`;
  async findMine(): Promise<SavedBusiness[]> {
    try { return await firstValueFrom(this.http.get<SavedBusiness[]>(this.url)); }
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
