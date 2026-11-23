import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import {
  ModerationAction,
  ModerationEntry,
  ModerationFilter,
  ModerationOffer,
  ModerationResults,
} from '../domain/model/moderation';
import { ModerationRepository } from '../domain/ports/moderation.repository';

interface PageResponse<T> {
  content: T[];
  page: number;
  totalElements: number;
  totalPages: number;
}

interface ModerationActionResponse extends ModerationAction {
  offerStatus: string;
}

function toPage<T>(response: PageResponse<T>): ModerationResults<T> {
  return {
    items: response.content,
    page: response.page,
    totalElements: response.totalElements,
    totalPages: response.totalPages,
  };
}

/** ModerationRepository over the gateway route of catalog-service. */
@Injectable()
export class HttpModerationRepository implements ModerationRepository {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async findOffers(filter: ModerationFilter, page: number, size: number): Promise<ModerationResults<ModerationOffer>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (filter.status) {
      params = params.set('status', filter.status);
    }
    if (filter.reportedOnly) {
      params = params.set('reported', true);
    }
    if (filter.text.trim()) {
      params = params.set('q', filter.text.trim());
    }
    try {
      const response = await firstValueFrom(
        this.http.get<PageResponse<ModerationOffer>>(`${this.baseUrl}/admin/offers`, { params }),
      );
      return toPage(response);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async remove(offerId: number, reason: string): Promise<ModerationAction> {
    try {
      const response = await firstValueFrom(
        this.http.delete<ModerationActionResponse>(`${this.baseUrl}/admin/offers/${offerId}`, {
          body: { reason: reason.trim() },
        }),
      );
      return {
        moderationId: response.moderationId,
        offerId: response.offerId,
        adminId: response.adminId,
        reason: response.reason,
        removedAt: response.removedAt,
      };
    } catch (error) {
      throw toApiError(error);
    }
  }

  async findHistory(page: number, size: number): Promise<ModerationResults<ModerationEntry>> {
    const params = new HttpParams().set('page', page).set('size', size);
    try {
      const response = await firstValueFrom(
        this.http.get<PageResponse<ModerationEntry>>(`${this.baseUrl}/admin/moderation-actions`, { params }),
      );
      return toPage(response);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
