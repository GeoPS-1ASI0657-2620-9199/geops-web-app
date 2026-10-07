import { Injectable, computed, inject, signal } from '@angular/core';
import { Session, displayNameOf, isActive } from '../domain/model/session';
import { SessionStorage } from '../domain/ports/session.storage';

/** Current session as read-only signals. Only the log-in and log-out use cases change it. */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly storage = inject(SessionStorage);
  private readonly current = signal<Session | null>(this.storage.read());

  readonly session = this.current.asReadonly();
  readonly role = computed(() => this.current()?.role ?? null);
  readonly displayName = computed(() => {
    const session = this.current();
    return session ? displayNameOf(session) : null;
  });

  /** The token is checked against the clock every time, not only when the store was created. */
  activeSession(now: number = Date.now()): Session | null {
    const session = this.current();
    return isActive(session, now) ? session : null;
  }

  start(session: Session): void {
    this.storage.write(session);
    this.current.set(session);
  }

  end(): void {
    this.storage.clear();
    this.current.set(null);
  }
}
