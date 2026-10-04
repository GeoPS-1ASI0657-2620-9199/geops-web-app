import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { Offer } from '../../../loyalty/domain/model/offer.entity';

/**
 * Domain entity for a coupon
 * Extends BaseEntity and includes references to user, payment, and offer details.
 * @property userId - ID of the user who owns the coupon
 * @property paymentId - ID of the payment that generated the coupon
 * @property paymentCode - Code generated at payment time
 * @property productType - (optional) Product type copied from payment
 * @property offerId - (optional) Reference to the offer ID
 * @property offer - (optional) Embedded offer data
 * @property code - The coupon code to redeem
 * @property expiresAt - (optional) Expiration date of the coupon
 * @property createdAt - Creation timestamp of the coupon
 */
export interface Coupon extends BaseEntity {
  userId: number;
  paymentId: number; // reference to payment that generated the coupon
  paymentCode: string; // code generated at payment time
  productType?: string; // copied from payment
  offerId?: number; // reference to the offer id
  offer?: Offer; // optional embedded offer data
  code: string; // the coupon code to redeem
  expiresAt?: string;
  createdAt: string;
}
