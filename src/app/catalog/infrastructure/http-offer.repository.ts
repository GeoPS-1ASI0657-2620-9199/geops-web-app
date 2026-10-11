import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { GeoPoint } from '../../shared/domain/geo-point';
import { NearbyOfferPage, PAGE_SIZE } from '../domain/model/nearby-offer';
import { OfferDetail } from '../domain/model/offer-detail';
import { OfferRepository } from '../domain/ports/offer.repository';
import {
  NearbyOffersResponse,
  OfferDetailResponse,
  toNearbyOfferPage,
  toOfferDetail,
} from './catalog.mapper';

/** OfferRepository over the gateway route of catalog-service. */
@Injectable()
export class HttpOfferRepository implements OfferRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async findNearby(
    origin: GeoPoint,
    radiusMinutes: number,
    page: number,
    category: string | null = null,
  ): Promise<NearbyOfferPage> {
    let params = new HttpParams()
      .set('lat', origin.latitude)
      .set('lng', origin.longitude)
      .set('radiusMinutes', radiusMinutes)
      .set('page', page)
      .set('size', PAGE_SIZE);
    if (category) {
      params = params.set('category', category);
    }
    try {
      const response = await firstValueFrom(
        this.http.get<NearbyOffersResponse>(`${this.baseUrl}/offers/nearby`, { params }),
      );
      return toNearbyOfferPage(response);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async categories(): Promise<string[]> {
    try {
      return await firstValueFrom(this.http.get<string[]>(`${this.baseUrl}/offers/categories`));
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findById(offerId: number): Promise<OfferDetail> {
    try {
      const response = await firstValueFrom(
        this.http.get<OfferDetailResponse>(`${this.baseUrl}/offers/${offerId}`),
      );
      return toOfferDetail(response);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
