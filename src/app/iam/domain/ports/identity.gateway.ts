import { RegisterConsumer, RegisteredUser } from '../model/register-consumer';
import { Credentials, IssuedToken } from '../model/session';

/**
 * Port to the Identity service. Implementations reject with ApiError when the service refuses
 * the operation (repeated email or phone, invalid data, wrong credentials) or cannot be reached.
 */
export abstract class IdentityGateway {
  abstract registerConsumer(person: RegisterConsumer): Promise<RegisteredUser>;
  abstract logIn(credentials: Credentials): Promise<IssuedToken>;
}
