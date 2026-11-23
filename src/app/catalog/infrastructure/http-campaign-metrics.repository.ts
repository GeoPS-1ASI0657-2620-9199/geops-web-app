import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import {
  BusinessBaseline,
  CampaignMetrics,
  CampaignMetricsSummary,
  PeriodRequest,
} from '../domain/model/campaign-metrics';
import { CampaignMetricsRepository } from '../domain/ports/campaign-metrics.repository';

/** Body of PUT /campaigns/baseline and GET /campaigns/baseline. */
interface BaselineResponse {
  businessId: number;
  customersPerWeek: number;
  averageTicket: number;
  declaredAt: string;
}

/** CampaignMetricsRepository over the routes of catalog-service; the bodies already match the model. */
@Injectable()
export class HttpCampaignMetricsRepository implements CampaignMetricsRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async findMetrics(campaignId: number, period: PeriodRequest): Promise<CampaignMetrics> {
    try {
      return await firstValueFrom(
        this.http.get<CampaignMetrics>(`${this.baseUrl}/campaigns/${campaignId}/metrics`, { params: paramsOf(period) }),
      );
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findSummary(period: PeriodRequest): Promise<CampaignMetricsSummary> {
    try {
      return await firstValueFrom(
        this.http.get<CampaignMetricsSummary>(`${this.baseUrl}/campaigns/metrics`, { params: paramsOf(period) }),
      );
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findBaseline(): Promise<BusinessBaseline | null> {
    try {
      const response = await firstValueFrom(
        this.http.get<BaselineResponse | null>(`${this.baseUrl}/campaigns/baseline`, { observe: 'response' }),
      );
      return response.status === 204 || !response.body ? null : toBaseline(response.body);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async declareBaseline(customersPerWeek: number, averageTicket: number): Promise<BusinessBaseline> {
    try {
      const response = await firstValueFrom(
        this.http.put<BaselineResponse>(`${this.baseUrl}/campaigns/baseline`, { customersPerWeek, averageTicket }),
      );
      return toBaseline(response);
    } catch (error) {
      throw toApiError(error);
    }
  }
}

function paramsOf(period: PeriodRequest): HttpParams {
  let params = new HttpParams();
  if (period.from) {
    params = params.set('from', period.from);
  }
  if (period.to) {
    params = params.set('to', period.to);
  }
  return params;
}

function toBaseline(response: BaselineResponse): BusinessBaseline {
  return {
    customersPerWeek: response.customersPerWeek,
    averageTicket: response.averageTicket,
    declaredAt: response.declaredAt,
  };
}
