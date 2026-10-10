import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { CampaignDraft, CampaignOffer, CreatedCampaign, PublishedCampaign } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import {
  CampaignOfferResponse,
  CampaignResponse,
  CreatedCampaignResponse,
  toCampaignOffer,
  toCreateCampaignRequest,
  toCreatedCampaign,
  toPublishedCampaign,
} from './campaign.mapper';

/** CampaignRepository over the gateway route of catalog-service; the interceptor adds the token. */
@Injectable()
export class HttpCampaignRepository implements CampaignRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async create(draft: CampaignDraft): Promise<CreatedCampaign> {
    try {
      const response = await firstValueFrom(
        this.http.post<CreatedCampaignResponse>(`${this.baseUrl}/campaigns`, toCreateCampaignRequest(draft)),
      );
      return toCreatedCampaign(response);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findMine(): Promise<Omit<PublishedCampaign, 'offers'>[]> {
    try {
      const response = await firstValueFrom(this.http.get<CampaignResponse[]>(`${this.baseUrl}/campaigns`));
      return response.map(toPublishedCampaign);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findOffers(campaignId: number): Promise<CampaignOffer[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<CampaignOfferResponse[]>(`${this.baseUrl}/campaigns/${campaignId}/offers`),
      );
      return response.map(toCampaignOffer);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
