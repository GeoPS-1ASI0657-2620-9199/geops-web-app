import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { NotificationsStore } from '../../../application/notifications.store';
import { Notification } from '../../../domain/model/notification.entity';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Notifications Dropdown Component
 *
 * Displays notifications in a dropdown menu from the header
 *
 * @summary Notification dropdown component
 */
@Component({
  selector: 'app-notifications-dropdown',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslateModule
  ],
  templateUrl: './notifications-dropdown.component.html',
  styleUrl: './notifications-dropdown.component.css'
})
export class NotificationsDropdownComponent {
  public readonly store = inject(NotificationsStore);
  private readonly router = inject(Router);

  onNotificationClick(notification: Notification): void {
    // Mark as read if not already
    if (!notification.isRead) {
      this.store.markAsRead(notification.id);
    }

    // Navigate to related page if actionUrl exists
    if (notification.actionUrl) {
      this.router.navigateByUrl(notification.actionUrl);
    }
  }

  onMarkAllAsRead(): void {
    this.store.markAllAsRead();
  }

  onDeleteNotification(event: Event, notificationId: number): void {
    event.stopPropagation();
    this.store.deleteNotification(notificationId);
  }

  onRefresh(): void {
    this.store.refresh();
  }

  getNotificationIcon(type: string): string {
    const iconMap: Record<string, string> = {
      'PAYMENT': 'payment',
      'PREMIUM_UPGRADE': 'workspace_premium',
      'PROFILE_UPDATE': 'person',
      'FAVORITE': 'favorite',
      'COUPON_EXPIRATION': 'schedule',
      'REVIEW_COMMENT': 'comment'
    };
    return iconMap[type] || 'notifications';
  }

  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)}min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `Hace ${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
  }
}
