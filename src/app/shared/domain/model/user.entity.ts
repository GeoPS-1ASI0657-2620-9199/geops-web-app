import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Domain entity for a user
 */
export interface User extends BaseEntity {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'CONSUMER' | 'ADMIN';
  plan: 'BASIC' | 'PREMIUM';
}
