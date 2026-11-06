import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { NotificationPreferences, EmailUnsubscription, LastLocation } from '../domain/model/preferences';
import { NotificationRepository } from '../domain/ports/notification.repository';
@Injectable()
export class HttpNotificationRepository implements NotificationRepository {
  private readonly http = inject(HttpClient);
  private readonly url = inject(API_BASE_URL);
  async preferences(): Promise<NotificationPreferences> {
    try { return await firstValueFrom(this.http.get<NotificationPreferences>(`${this.url}/notification-preferences`)); }
    catch (error) { throw toApiError(error); }
  }
  async update(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const { pushEnabled, emailEnabled, dailyLimit } = preferences;
    try { return await firstValueFrom(this.http.put<NotificationPreferences>(`${this.url}/notification-preferences`, { pushEnabled, emailEnabled, dailyLimit })); }
    catch (error) { throw toApiError(error); }
  }
  async unsubscribe(token: string): Promise<EmailUnsubscription> {
    try { return await firstValueFrom(this.http.post<EmailUnsubscription>(`${this.url}/email-unsubscriptions`, { token })); }
    catch (error) { throw toApiError(error); }
  }
  async recordLocation(location: LastLocation): Promise<void> {
    try { await firstValueFrom(this.http.put(`${this.url}/locations/last`, location)); }
    catch (error) { throw toApiError(error); }
  }
}
