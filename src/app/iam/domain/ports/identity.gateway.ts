import { RegisterBusiness } from '../model/register-business';
import { RegisterConsumer, RegisteredUser } from '../model/register-consumer';
import { Credentials, IssuedToken } from '../model/session';

/**
 * Port to the Identity service. Implementations reject with ApiError when the service refuses
 * the operation (repeated email or phone, invalid data, wrong credentials) or cannot be reached.
 */
export abstract class IdentityGateway {
  abstract registerConsumer(person: RegisterConsumer): Promise<RegisteredUser>;
  abstract registerBusiness(owner: RegisterBusiness): Promise<RegisteredUser>;
  abstract logIn(credentials: Credentials): Promise<IssuedToken>;
  /** Revokes the token on the server (US26), so the gateway rejects it before it expires. */
  abstract logOut(accessToken: string): Promise<void>;
}
