import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource, NotificationsResponse, CreateNotificationRequest } from './notifications-response';
import { NotificationsAssembler } from './notifications-assembler';
import { environment } from '../../../environments/environment';

/**
 * Notifications API Endpoint Service
 *
 * Handles HTTP operations for notifications following DDD infrastructure pattern
 *
 * @summary Infrastructure service for notification HTTP operations
 */
@Injectable({ providedIn: 'root' })
export class NotificationsApiEndpoint extends BaseApiEndpoint<
  Notification,
  NotificationResource,
  NotificationsResponse,
  NotificationsAssembler
> {
  /**
   * Creates an instance of the NotificationsApiEndpoint service
   * @param http - Angular HTTP client
   */
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}/notifications`, new NotificationsAssembler());
  }

  /**
   * Get all notifications for a specific user
   * @param userId - The user ID
   * @returns Observable of notification array
   */
  getUserNotifications(userId: number): Observable<Notification[]> {
    const url = `${this.endpointUrl}/user/${userId}`;
    return this.http
      .get<NotificationResource[]>(url)
      .pipe(map(list => list.map(r => this.assembler.toEntityFromResource(r))));
  }

  /**
   * Get unread notification count for a user
   * @param userId - The user ID
   * @returns Observable of unread count
   */
  getUnreadCount(userId: number): Observable<number> {
    const url = `${this.endpointUrl}/user/${userId}/unread-count`;
    return this.http.get<number>(url);
  }

  /**
   * Mark a specific notification as read
   * @param notificationId - The notification ID
   * @returns Observable of updated notification
   */
  markAsRead(notificationId: number): Observable<Notification> {
    const url = `${this.endpointUrl}/${notificationId}/mark-as-read`;
    return this.http
      .put<NotificationResource>(url, {})
      .pipe(map(r => this.assembler.toEntityFromResource(r)));
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - The user ID
   * @returns Observable of number of notifications marked as read
   */
  markAllAsRead(userId: number): Observable<number> {
    const url = `${this.endpointUrl}/user/${userId}/mark-all-as-read`;
    return this.http.put<number>(url, {});
  }

  /**
   * Create a new notification
   * @param request - The notification creation request
   * @returns Observable of created notification
   */
  createNotification(request: CreateNotificationRequest): Observable<Notification> {
    const body: NotificationResource = {
      ...request,
      id: 0, // Will be assigned by backend
      isRead: false,
      createdAt: new Date().toISOString(),
    } as any;

    return this.http
      .post<NotificationResource>(this.endpointUrl, body)
      .pipe(map(r => this.assembler.toEntityFromResource(r)));
  }
}
