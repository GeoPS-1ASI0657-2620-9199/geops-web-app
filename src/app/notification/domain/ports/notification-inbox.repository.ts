import { InboxNotification } from '../model/inbox-notification';

export abstract class NotificationInboxRepository {
  abstract latest(size: number): Promise<InboxNotification[]>;
  abstract unreadCount(): Promise<number>;
  abstract markAllRead(): Promise<void>;
}
