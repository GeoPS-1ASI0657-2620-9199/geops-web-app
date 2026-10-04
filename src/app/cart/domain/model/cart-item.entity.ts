import { BaseEntity } from '../../../shared/infrastructure/base-entity';

/**
 * Domain entity for a cart item
 * Extends BaseEntity and includes user and offer details, quantity, and total price.
 * @property userId - ID of the user who owns the cart item
 * @property offerId - ID of the offer associated with the cart item
 * @property offerTitle - Title of the offer
 * @property offerPrice - Price of the offer
 * @property offerImageUrl - Image URL of the offer
 * @property quantity - Quantity of the offer in the cart
 * @property total - Total price for the quantity of the offer
 */
export interface CartItem extends BaseEntity {
  userId: number;
  offerId: number;
  offerTitle: string;
  offerPrice: number;
  offerImageUrl: string;
  quantity: number;
  total: number;
}
