import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { NotificationType } from '../domain/model/notification.entity';

/**
 * Notification resource
 */
export interface NotificationResource extends BaseResource {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  createdAt: string;
}

/**
 * Notifications response (array wrapper)
 */
export interface NotificationsResponse extends BaseResponse {
  notifications: NotificationResource[];
}

/**
 * Create notification request
 */
export interface CreateNotificationRequest {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
}
