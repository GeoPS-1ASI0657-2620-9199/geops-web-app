import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { CartItem } from './cart-item.entity';

/**
 * Domain entity for a shopping cart
 * Extends BaseEntity and includes user ID, cart items, total items, total amount, and timestamps.
 * @property userId - ID of the user who owns the cart
 * @property items - Array of cart items
 * @property totalItems - Total number of items in the cart
 * @property totalAmount - Total amount for the cart
 * @property createdAt - ISO timestamp when the cart was created
 * @property updatedAt - ISO timestamp when the cart was last updated
 */
export interface Cart extends BaseEntity {
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}
