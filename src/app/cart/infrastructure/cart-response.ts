import { BaseResponse, BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a cart item for API communication
 * Extends BaseResource and includes user and offer details, quantity, and total price.
 * @property userId - ID of the user who owns the cart item
 * @property offerId - ID of the offer associated with the cart item
 * @property offerTitle - Title of the offer
 * @property offerPrice - Price of the offer
 * @property offerImageUrl - Image URL of the offer
 * @property quantity - Quantity of the offer in the cart
 * @property total - Total price for the quantity of the offer
 */
export interface CartItemResource extends BaseResource {
  userId: number;
  offerId: number;
  offerTitle: string;
  offerPrice: number;
  offerImageUrl: string;
  quantity: number;
  total: number;
}

/**
 * Resource representation of a cart for API communication
 * Extends BaseResource and includes user ID, cart items, total items, total amount, and timestamps.
 * @property userId - ID of the user who owns the cart
 * @property items - Array of cart items
 * @property totalItems - Total number of items in the cart
 * @property totalAmount - Total amount for the cart
 * @property createdAt - ISO timestamp when the cart was created
 * @property updatedAt - ISO timestamp when the cart was last updated
 */
export interface CartResource extends BaseResource {
  userId: number;
  items: CartItemResource[];
  totalItems: number;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * API response structure for carts
 * Extends BaseResponse and includes an array of CartResource objects.
 * @property data - Array of cart resources
 * @see BaseResponse
 * @see CartResource
 */
export interface CartResponse extends BaseResponse {
  data: CartResource[];
}
