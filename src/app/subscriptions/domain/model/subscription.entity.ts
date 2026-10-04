import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Domain entity for a subscription plan
 *
 * Extends BaseEntity and includes pricing and type information.
 * @property price - The price of the subscription
 * @property recommended - Whether the subscription is recommended
 * @property type - The type of subscription ('BASIC' | 'PREMIUM')
 */
export interface Subscription extends BaseEntity {
  price: number;
  recommended: boolean;
  type: 'BASIC' | 'PREMIUM';
}
