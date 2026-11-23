import { Injectable, inject } from '@angular/core';
import { InboxNotification } from '../domain/model/inbox-notification';
import { NotificationInboxRepository } from '../domain/ports/notification-inbox.repository';

const LATEST_SIZE = 20;

@Injectable({ providedIn: 'root' })
export class ListMyNotificationsUseCase {
  private readonly repository = inject(NotificationInboxRepository);
  execute(): Promise<InboxNotification[]> { return this.repository.latest(LATEST_SIZE); }
}

@Injectable({ providedIn: 'root' })
export class CountUnreadNotificationsUseCase {
  private readonly repository = inject(NotificationInboxRepository);
  execute(): Promise<number> { return this.repository.unreadCount(); }
}

@Injectable({ providedIn: 'root' })
export class MarkNotificationsReadUseCase {
  private readonly repository = inject(NotificationInboxRepository);
  execute(): Promise<void> { return this.repository.markAllRead(); }
}
