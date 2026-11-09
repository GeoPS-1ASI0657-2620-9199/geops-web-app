import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { RadiusPreferenceGateway } from '../domain/ports/radius-preference.gateway';

/** Body of GET /api/v1/consumer-profiles/me and of the 200 of its PUT search-radius. */
export interface ConsumerProfileResponse {
  consumerId: number;
  searchRadiusMinutes: number;
}

/** Body of PUT /api/v1/consumer-profiles/me/search-radius. */
export interface SearchRadiusRequest {
  radiusMinutes: number;
}

/** RadiusPreferenceGateway over the gateway route of identity-service; the interceptor adds the token. */
@Injectable()
export class HttpRadiusPreferenceGateway implements RadiusPreferenceGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/consumer-profiles/me`;

  async fetch(): Promise<number> {
    try {
      const profile = await firstValueFrom(this.http.get<ConsumerProfileResponse>(this.url));
      return profile.searchRadiusMinutes;
    } catch (error) {
      throw toApiError(error);
    }
  }

  async save(minutes: number): Promise<void> {
    const body: SearchRadiusRequest = { radiusMinutes: minutes };
    try {
      await firstValueFrom(this.http.put<ConsumerProfileResponse>(`${this.url}/search-radius`, body));
    } catch (error) {
      throw toApiError(error);
    }
  }
}
