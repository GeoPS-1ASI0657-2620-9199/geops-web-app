import { UserRole } from './user-role';

/** Email and password typed on the login page (US21, US23). */
export interface Credentials {
  readonly email: string;
  readonly password: string;
}

/** What Identity answers to a valid login (identity-service TokenResponse). */
export interface IssuedToken {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
  readonly userId: number;
  readonly role: UserRole;
  readonly consumerId?: number;
  readonly businessId?: number;
  readonly businessName?: string;
}

/** Authenticated session kept for the life of the browser tab. */
export interface Session {
  readonly accessToken: string;
  /** Epoch milliseconds after which the token is no longer accepted. */
  readonly expiresAt: number;
  readonly userId: number;
  readonly role: UserRole;
  readonly email: string;
  readonly consumerId?: number;
  readonly businessId?: number;
  readonly businessName?: string;
}

const MILLIS_PER_SECOND = 1000;

export function startSession(token: IssuedToken, email: string, now: number): Session {
  return {
    accessToken: token.accessToken,
    expiresAt: now + token.expiresInSeconds * MILLIS_PER_SECOND,
    userId: token.userId,
    role: token.role,
    email,
    consumerId: token.consumerId,
    businessId: token.businessId,
    businessName: token.businessName,
  };
}

export function isActive(session: Session | null, now: number): session is Session {
  return session !== null && now < session.expiresAt;
}

/** Name shown in the top bar: the business for owners, the email for consumers. */
export function displayNameOf(session: Session): string {
  return session.businessName ?? session.email;
}
