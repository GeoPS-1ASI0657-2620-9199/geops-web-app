import { OfferResource } from '../../loyalty/infrastructure/offers/offers-response';
import { BaseResponse, BaseResource } from '../../shared/infrastructure/base-response';

/**
 * Resource representation of a coupon
 * extends BaseResource
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
export interface CouponResource extends BaseResource {
  userId: number;
  paymentId: number;
  paymentCode: string;
  productType?: string;
  offerId?: number | string;
  offer?: OfferResource; // optional embedded offer
  code: string;
  expiresAt?: string;
  createdAt: string;
}

/**
 * Response structure for multiple coupons
 * extends BaseResponse
 * @property data - Array of CouponResource objects
 */
export interface CouponsResponse extends BaseResponse {
  data: CouponResource[];
}
