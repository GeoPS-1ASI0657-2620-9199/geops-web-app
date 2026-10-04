import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Defines possible user roles within the system.
 */
export type UserRole = 'OWNER' | 'CONSUMER' | 'ADMIN';

/**
 * Defines available subscription plans for users.
 */
export type PlanType = 'BASIC' | 'PREMIUM';

/**
 * Main user entity interface.
 * Extends BaseEntity and includes personal information, role, and subscription plan.
 * Additional details (consumer or owner specific) are stored in separate entities.
 */
export interface User extends BaseEntity {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  plan: PlanType;
  phone: string;
  createdAt?: Date;
  updatedAt?: Date;
}
