import { RegisterBusiness } from '../domain/model/register-business';
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
  businessProfile?: BusinessProfileRequest;
}

/** businessProfile of the register body for role BUSINESS_OWNER. */
export interface BusinessProfileRequest {
  businessName: string;
  businessType?: string;
  ruc: string;
  address: string;
  latitude: number;
  longitude: number;
  openingHours?: string;
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

/** Optional texts travel only when the owner wrote them. */
function optional(value: string): string | undefined {
  return value ? value : undefined;
}

export function toRegisterBusinessRequest(owner: RegisterBusiness): RegisterUserRequest {
  const business = owner.business;
  return {
    role: 'BUSINESS_OWNER',
    fullName: owner.fullName,
    email: owner.email,
    phone: owner.phone,
    password: owner.password,
    businessProfile: {
      businessName: business.businessName,
      businessType: optional(business.businessType),
      ruc: business.ruc,
      address: business.address,
      latitude: business.location.latitude,
      longitude: business.location.longitude,
      openingHours: optional(business.openingHours),
    },
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
