import { Injectable, inject } from '@angular/core';
import { NotificationPreferences } from '../domain/model/preferences';
import { NotificationRepository } from '../domain/ports/notification.repository';
@Injectable({ providedIn: 'root' })
export class GetNotificationPreferencesUseCase {
  private readonly repository = inject(NotificationRepository);
  execute() { return this.repository.preferences(); }
}
@Injectable({ providedIn: 'root' })
export class UpdateNotificationPreferencesUseCase {
  private readonly repository = inject(NotificationRepository);
  execute(preferences: NotificationPreferences) { return this.repository.update(preferences); }
}
@Injectable({ providedIn: 'root' })
export class UnsubscribeEmailUseCase {
  private readonly repository = inject(NotificationRepository);
  execute(token: string) { return this.repository.unsubscribe(token); }
}
