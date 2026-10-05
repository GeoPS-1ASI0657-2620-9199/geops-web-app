import { RegisterConsumer, RegisteredUser, fullNameOf } from '../domain/model/register-consumer';
import { Credentials, IssuedToken } from '../domain/model/session';
import { UserRole } from '../domain/model/user-role';

/** Body of POST /api/v1/auth/register (identity-service RegisterUserRequest). */
export interface RegisterUserRequest {
  role: UserRole;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

/** Body of the 201 answer (identity-service RegisteredUserResponse). */
export interface RegisteredUserResponse {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  consumerProfileId?: number;
  businessProfileId?: number;
}

export function toRegisterConsumerRequest(person: RegisterConsumer): RegisterUserRequest {
  return {
    role: 'CONSUMER',
    fullName: fullNameOf(person),
    email: person.email,
    phone: person.phone,
    password: person.password,
  };
}

export function toRegisteredUser(response: RegisteredUserResponse): RegisteredUser {
  return {
    userId: response.userId,
    fullName: response.fullName,
    email: response.email,
    role: response.role,
  };
}

/** Body of the 200 answer of POST /api/v1/auth/login (identity-service TokenResponse). */
export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  role: UserRole;
  consumerId?: number;
  businessId?: number;
  businessName?: string;
}

export function toLogInRequest(credentials: Credentials): Credentials {
  return { email: credentials.email, password: credentials.password };
}

export function toIssuedToken(response: TokenResponse): IssuedToken {
  return {
    accessToken: response.accessToken,
    expiresInSeconds: response.expiresIn,
    userId: response.userId,
    role: response.role,
    consumerId: response.consumerId,
    businessId: response.businessId,
    businessName: response.businessName,
  };
}
