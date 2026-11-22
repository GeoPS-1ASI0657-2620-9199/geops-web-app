import { Injectable, inject } from '@angular/core';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import { SessionStore } from './session.store';

/**
 * Closes the session: forgets it on this browser at once and asks Identity to revoke the token (US26), so it
 * stops opening the API before it expires. The revocation is best effort: without network the local session
 * still ends. When the server already rejected the token (a 401), there is nothing to revoke.
 */
@Injectable({ providedIn: 'root' })
export class LogOutUseCase {
  private readonly sessions = inject(SessionStore);
  private readonly identity = inject(IdentityGateway);

  execute(options: { revoke?: boolean } = {}): void {
    const token = this.sessions.session()?.accessToken;
    this.sessions.end();
    if (token && options.revoke !== false) {
      this.identity.logOut(token).catch(() => undefined);
    }
  }
}
