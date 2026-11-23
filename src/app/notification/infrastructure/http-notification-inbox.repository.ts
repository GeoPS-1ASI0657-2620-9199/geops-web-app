import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { InboxNotification } from '../domain/model/inbox-notification';
import { NotificationInboxRepository } from '../domain/ports/notification-inbox.repository';

@Injectable()
export class HttpNotificationInboxRepository implements NotificationInboxRepository {
  private readonly http = inject(HttpClient);
  private readonly url = inject(API_BASE_URL);

  async latest(size: number): Promise<InboxNotification[]> {
    try { return await firstValueFrom(this.http.get<InboxNotification[]>(`${this.url}/notifications`, { params: { size } })); }
    catch (error) { throw toApiError(error); }
  }

  async unreadCount(): Promise<number> {
    try { return (await firstValueFrom(this.http.get<{ unread: number }>(`${this.url}/notifications/unread-count`))).unread; }
    catch (error) { throw toApiError(error); }
  }

  async markAllRead(): Promise<void> {
    try { await firstValueFrom(this.http.post<void>(`${this.url}/notifications/read`, null)); }
    catch (error) { throw toApiError(error); }
  }
}
