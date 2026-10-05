import { Injectable, inject } from '@angular/core';
import { SessionStore } from './session.store';

/** Forgets the session on this browser. The token simply expires on the server side. */
@Injectable({ providedIn: 'root' })
export class LogOutUseCase {
  private readonly sessions = inject(SessionStore);

  execute(): void {
    this.sessions.end();
  }
}
