import { Injectable } from '@angular/core';
import { Session } from '../domain/model/session';
import { SessionStorage } from '../domain/ports/session.storage';

const SESSION_KEY = 'geops.session';

/**
 * Session in the browser sessionStorage: it survives a reload but not closing the tab, and it is
 * never shared with other tabs (S-03). A damaged entry is discarded instead of breaking the app.
 */
@Injectable()
export class BrowserSessionStorage implements SessionStorage {
  read(): Session | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const session = JSON.parse(raw) as Session;
      return typeof session.accessToken === 'string' && typeof session.expiresAt === 'number'
        ? session
        : null;
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }

  write(session: Session): void {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  clear(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
