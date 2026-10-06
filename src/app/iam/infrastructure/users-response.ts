// src/app/identity/infrastructure/users/users-response.ts

export type UserRole = 'OWNER' | 'CONSUMER' | 'ADMIN';
export type PlanType = 'BASIC' | 'PREMIUM';

/**
 * User resource returned by API.
 * Matches the backend UserResource structure.
 */
export interface UserResource {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  plan: PlanType;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Authentication resource returned by sign-in/sign-up endpoints.
 */
export interface AuthenticationResource {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  plan: PlanType;
  message: string;
}

/**
 * API response for users.
 */
export interface UsersResponse {}


