import { NotificationPreferences, EmailUnsubscription, LastLocation } from '../model/preferences';
export abstract class NotificationRepository {
  abstract preferences(): Promise<NotificationPreferences>;
  abstract update(preferences: NotificationPreferences): Promise<NotificationPreferences>;
  abstract unsubscribe(token: string): Promise<EmailUnsubscription>;
  abstract recordLocation(location: LastLocation): Promise<void>;
}
