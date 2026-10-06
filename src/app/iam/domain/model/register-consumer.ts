import { UserRole } from './user-role';

/** Same limits that identity-service validates in RegisterUserRequest. */
export const FULL_NAME_MAX_LENGTH = 255;
export const EMAIL_MAX_LENGTH = 255;
export const PHONE_PATTERN = /^9\d{8}$/;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

/** Data a person gives to open a consumer account (US20). */
export interface RegisterConsumer {
  readonly givenNames: string;
  readonly surnames: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
}

/** Account that Identity created. Registration does not log the user in. */
export interface RegisteredUser {
  readonly userId: number;
  readonly fullName: string;
  readonly email: string;
  readonly role: UserRole;
}

/** Identity stores one full name; the form asks for given names and surnames like the Figma. */
export function fullNameOf(person: Pick<RegisterConsumer, 'givenNames' | 'surnames'>): string {
  return `${person.givenNames.trim()} ${person.surnames.trim()}`.replace(/\s+/g, ' ').trim();
}

/** Emails are compared without case or surrounding spaces. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
