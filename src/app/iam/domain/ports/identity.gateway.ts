import { RegisterConsumer, RegisteredUser } from '../model/register-consumer';

/**
 * Port to the Identity service. Implementations reject with ApiError when the service refuses
 * the operation (repeated email or phone, invalid data) or cannot be reached.
 */
export abstract class IdentityGateway {
  abstract registerConsumer(person: RegisterConsumer): Promise<RegisteredUser>;
}
