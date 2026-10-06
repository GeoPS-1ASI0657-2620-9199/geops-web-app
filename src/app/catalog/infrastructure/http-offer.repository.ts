import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { GeoPoint } from '../../shared/domain/geo-point';
import { NearbyOfferPage, PAGE_SIZE } from '../domain/model/nearby-offer';
import { OfferRepository } from '../domain/ports/offer.repository';
import { NearbyOffersResponse, toNearbyOfferPage } from './catalog.mapper';

/** OfferRepository over the gateway route of catalog-service. */
@Injectable()
export class HttpOfferRepository implements OfferRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async findNearby(origin: GeoPoint, radiusMinutes: number, page: number): Promise<NearbyOfferPage> {
    const params = new HttpParams()
      .set('lat', origin.latitude)
      .set('lng', origin.longitude)
      .set('radiusMinutes', radiusMinutes)
      .set('page', page)
      .set('size', PAGE_SIZE);
    try {
      const response = await firstValueFrom(
        this.http.get<NearbyOffersResponse>(`${this.baseUrl}/offers/nearby`, { params }),
      );
      return toNearbyOfferPage(response);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
