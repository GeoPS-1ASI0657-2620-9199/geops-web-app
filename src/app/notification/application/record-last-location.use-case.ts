import { Injectable, inject } from '@angular/core';
import { SessionStore } from '../../iam/application/session.store';
import { NotificationRepository } from '../domain/ports/notification.repository';
import { LastLocation } from '../domain/model/preferences';
const MIN_UPDATE_INTERVAL_MS = 5 * 60 * 1000;
@Injectable({ providedIn: 'root' })
export class RecordLastLocationUseCase {
  private readonly sessions = inject(SessionStore);
  private readonly repository = inject(NotificationRepository);
  private readonly lastSent = new Map<number, number>();
  private readonly inFlight = new Set<number>();
  async execute(location: LastLocation): Promise<void> {
    const session = this.sessions.activeSession();
    if (session?.role !== 'CONSUMER') return;
    const id = session.userId;
    const now = Date.now();
    if (this.inFlight.has(id) || now - (this.lastSent.get(id) ?? -Infinity) < MIN_UPDATE_INTERVAL_MS) return;
    this.inFlight.add(id);
    try { await this.repository.recordLocation(location); this.lastSent.set(id, now); }
    catch { }
    finally { this.inFlight.delete(id); }
  }
}
