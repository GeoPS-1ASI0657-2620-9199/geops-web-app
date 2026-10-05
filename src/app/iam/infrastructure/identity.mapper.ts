import { RegisterConsumer, RegisteredUser, fullNameOf } from '../domain/model/register-consumer';
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
