import { Injectable, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { retry } from 'rxjs/operators';

import { Notification } from '../domain/model/notification.entity';
import { NotificationsApiEndpoint } from '../infrastructure/notifications-api-endpoint';

/**
 * Notifications Store
 *
 * Application layer store for managing notification state using Angular Signals
 *
 * @summary Manages notification application state and business operations
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationsStore {
  private readonly api = inject(NotificationsApiEndpoint);

  // Private signals for state mutation
  private readonly notificationsSignal = signal<Notification[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly currentUserIdSignal = signal<number | null>(null);

  // Public readonly signals
  readonly notifications = this.notificationsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();
  readonly currentUserId = this.currentUserIdSignal.asReadonly();

  // Computed signals
  readonly notificationsCount = computed(() => this.notifications().length);
  readonly unreadNotifications = computed(() =>
    this.notifications().filter(n => !n.isRead)
  );
  readonly readNotifications = computed(() =>
    this.notifications().filter(n => n.isRead)
  );
  readonly unreadCount = computed(() => this.unreadNotifications().length);
  readonly hasUnread = computed(() => this.unreadCount() > 0);

  // Computed signals for notification types
  readonly paymentNotifications = computed(() =>
    this.notifications().filter(n => n.type === 'PAYMENT')
  );
  readonly premiumNotifications = computed(() =>
    this.notifications().filter(n => n.type === 'PREMIUM_UPGRADE')
  );
  readonly profileNotifications = computed(() =>
    this.notifications().filter(n => n.type === 'PROFILE_UPDATE')
  );
  readonly favoriteNotifications = computed(() =>
    this.notifications().filter(n => n.type === 'FAVORITE')
  );
  readonly couponNotifications = computed(() =>
    this.notifications().filter(n => n.type === 'COUPON_EXPIRATION')
  );
  readonly reviewNotifications = computed(() =>
    this.notifications().filter(n => n.type === 'REVIEW_COMMENT')
  );

  /**
   * Load notifications for a specific user
   * @param userId - The user ID
   */
  loadNotifications(userId: number): void {
    this.currentUserIdSignal.set(userId);
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getUserNotifications(userId)
      .pipe(retry(2))
      .subscribe({
        next: (notifications) => {
          this.notificationsSignal.set(notifications);
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error loading notifications';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[NotificationsStore] Error loading notifications:', err);
        }
      });
  }

  /**
   * Refresh notifications for current user
   */
  refresh(): void {
    const userId = this.currentUserIdSignal();
    if (userId) {
      this.loadNotifications(userId);
    }
  }

  /**
   * Mark a notification as read
   * @param notificationId - The notification ID
   */
  markAsRead(notificationId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.markAsRead(notificationId)
      .pipe(retry(2))
      .subscribe({
        next: (updatedNotification) => {
          // Update the notification in the local state
          this.notificationsSignal.update(notifications => {
            const index = notifications.findIndex(n => n.id === notificationId);
            if (index !== -1) {
              const updated = [...notifications];
              updated[index] = updatedNotification;
              return updated;
            }
            return notifications;
          });
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error marking notification as read';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[NotificationsStore] Error marking as read:', err);
        }
      });
  }

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead(): void {
    const userId = this.currentUserIdSignal();
    if (!userId) {
      console.warn('[NotificationsStore] No user ID set, cannot mark all as read');
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.markAllAsRead(userId)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          // Mark all notifications as read in local state
          this.notificationsSignal.update(notifications =>
            notifications.map(n => ({ ...n, isRead: true }))
          );
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error marking all notifications as read';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[NotificationsStore] Error marking all as read:', err);
        }
      });
  }

  /**
   * Delete a notification
   * @param notificationId - The notification ID
   */
  deleteNotification(notificationId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.delete(notificationId)
      .pipe(retry(2))
      .subscribe({
        next: () => {
          // Remove notification from local state
          this.notificationsSignal.update(notifications =>
            notifications.filter(n => n.id !== notificationId)
          );
          this.loadingSignal.set(false);
        },
        error: (err) => {
          const errorMessage = err?.message || 'Error deleting notification';
          this.errorSignal.set(errorMessage);
          this.loadingSignal.set(false);
          console.error('[NotificationsStore] Error deleting notification:', err);
        }
      });
  }

  /**
   * Get notification by ID
   * @param notificationId - The notification ID
   * @returns The notification or undefined
   */
  getNotificationById(notificationId: number): Notification | undefined {
    return this.notifications().find(n => n.id === notificationId);
  }

  /**
   * Get notifications by type
   * @param type - The notification type
   * @returns Array of notifications of specified type
   */
  getNotificationsByType(type: string): Notification[] {
    return this.notifications().filter(n => n.type === type);
  }

  /**
   * Clear all notifications from state (does not delete from backend)
   */
  clearState(): void {
    this.notificationsSignal.set([]);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.currentUserIdSignal.set(null);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.errorSignal.set(null);
  }
}
