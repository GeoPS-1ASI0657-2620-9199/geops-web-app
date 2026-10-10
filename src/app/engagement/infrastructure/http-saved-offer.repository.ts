import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { SavedOffer } from '../domain/model/saved-offer';
import { SavedOfferRepository } from '../domain/ports/saved-offer.repository';

/** Body of GET /api/v1/saved-offers (engagement-service SavedOfferResponse). */
export interface SavedOfferResponse {
  savedOfferId: number;
  offerId: number;
  businessId: number;
  businessName: string;
  title: string;
  validTo: string;
  expired: boolean;
  savedAt: string;
}

export function toSavedOffer(response: SavedOfferResponse): SavedOffer {
  return { ...response };
}

/** SavedOfferRepository over the gateway route of engagement-service; the interceptor adds the token. */
@Injectable()
export class HttpSavedOfferRepository implements SavedOfferRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/saved-offers`;

  async findMine(): Promise<SavedOffer[]> {
    try {
      const response = await firstValueFrom(this.http.get<SavedOfferResponse[]>(this.url));
      return response.map(toSavedOffer);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async save(offerId: number): Promise<void> {
    try {
      await firstValueFrom(this.http.post(this.url, { offerId }));
    } catch (error) {
      throw toApiError(error);
    }
  }

  async remove(offerId: number): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.url}/${offerId}`));
    } catch (error) {
      throw toApiError(error);
    }
  }
}
