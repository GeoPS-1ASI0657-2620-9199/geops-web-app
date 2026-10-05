import { Injectable, inject } from '@angular/core';
import { Credentials, Session, startSession } from '../domain/model/session';
import { normalizeEmail } from '../domain/model/register-consumer';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import { SessionStore } from './session.store';

/** Logs a consumer or a business owner in and keeps the token with its expiry (US21, US23). */
@Injectable({ providedIn: 'root' })
export class LogInUseCase {
  private readonly identity = inject(IdentityGateway);
  private readonly sessions = inject(SessionStore);

  async execute(credentials: Credentials, now: () => number = Date.now): Promise<Session> {
    const email = normalizeEmail(credentials.email);
    const token = await this.identity.logIn({ email, password: credentials.password });
    const session = startSession(token, email, now());
    this.sessions.start(session);
    return session;
  }
}
