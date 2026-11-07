import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { PushSubscriptionsRepository } from '../domain/ports/push.provider';
@Injectable()
export class HttpPushSubscriptionsRepository implements PushSubscriptionsRepository {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/push-subscriptions`;
  async register(fcmToken: string) {
    try { return await firstValueFrom(this.http.post<{ subscriptionId: number; createdAt: string }>(this.url, { fcmToken, userAgent: navigator.userAgent.slice(0, 255) })); }
    catch (error) { throw toApiError(error); }
  }
  async remove(subscriptionId: number): Promise<void> {
    try { await firstValueFrom(this.http.delete(`${this.url}/${subscriptionId}`)); }
    catch (error) { throw toApiError(error); }
  }
}
