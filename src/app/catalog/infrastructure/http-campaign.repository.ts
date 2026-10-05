import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { CampaignDraft, CreatedCampaign } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { CreatedCampaignResponse, toCreateCampaignRequest, toCreatedCampaign } from './campaign.mapper';

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
}
