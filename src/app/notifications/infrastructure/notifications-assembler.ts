import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Notification } from '../domain/model/notification.entity';
import { NotificationResource, NotificationsResponse } from './notifications-response';

/**
 * Assembler for Notification transformations
 *
 * Handles conversions between domain entities and API resources
 */
export class NotificationsAssembler implements BaseAssembler<Notification, NotificationResource, NotificationsResponse> {

  /**
   * Converts a notification resource to domain entity
   * @param resource - The notification resource from API
   * @returns The notification domain entity
   */
  toEntityFromResource(resource: NotificationResource): Notification {
    return {
      id: resource.id,
      userId: resource.userId,
      type: resource.type,
      title: resource.title,
      message: resource.message,
      isRead: resource.isRead,
      relatedEntityId: resource.relatedEntityId,
      relatedEntityType: resource.relatedEntityType,
      actionUrl: resource.actionUrl,
      createdAt: resource.createdAt
    };
  }

  /**
   * Converts a notification domain entity to resource
   * @param entity - The notification domain entity
   * @returns The notification resource for API
   */
  toResourceFromEntity(entity: Notification): NotificationResource {
    return {
      id: entity.id,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      isRead: entity.isRead,
      relatedEntityId: entity.relatedEntityId,
      relatedEntityType: entity.relatedEntityType,
      actionUrl: entity.actionUrl,
      createdAt: entity.createdAt
    };
  }

  /**
   * Converts API response to array of notification entities
   * @param response - The API response
   * @returns Array of notification domain entities
   */
  toEntitiesFromResponse(response: NotificationsResponse): Notification[] {
    return response.notifications.map(resource => this.toEntityFromResource(resource));
  }
}
