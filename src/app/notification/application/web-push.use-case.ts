import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../../iam/application/session.store';
import { PushProvider, PushSubscriptionStorage, PushSubscriptionsRepository } from '../domain/ports/push.provider';
import { PushUnavailableError } from '../domain/model/push-errors';
@Injectable({ providedIn: 'root' })
export class WebPushUseCase {
  private readonly sessions = inject(SessionStore);
  private readonly push = inject(PushProvider);
  private readonly subscriptions = inject(PushSubscriptionsRepository);
  private readonly storage = inject(PushSubscriptionStorage);
  isActive() { const session = this.sessions.activeSession(); return !!session && this.storage.read(session.userId) !== null; }
  async enable() {
    const session = this.sessions.activeSession();
    if (session?.role !== 'CONSUMER') throw new PushUnavailableError();
    const token = await this.push.enable();
    const subscription = await this.subscriptions.register(token);
    this.storage.write(session.userId, subscription.subscriptionId);
  }
  async disable() {
    const session = this.sessions.activeSession();
    if (!session) return;
    const id = this.storage.read(session.userId);
    if (id !== null) await this.subscriptions.remove(id);
    await this.push.disable();
    this.storage.clear(session.userId);
  }
}
