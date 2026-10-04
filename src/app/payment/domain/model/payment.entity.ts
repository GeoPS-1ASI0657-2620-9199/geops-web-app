import { BaseEntity } from '../../../shared/infrastructure/base-entity';
import { PaymentMethod, PaymentStatus } from './payment-method.enum';

/**
 * Payment
 *
 * Represents a persisted payment record in the application.
 * - `productType` and `productId` indicate which domain/product the payment refers to (for example, an `offer`).
 * - `paymentCodes` holds generated coupon/payment codes produced at purchase time (one entry per coupon/unit).
 * - The entity extends `BaseEntity` and includes auditing timestamps.
 *
 * Fields:
 * @property userId - id of the user who made the payment
 * @property cartId - id of the cart used for the payment
 * @property amount - total paid amount
 * @property productType - the domain/table this payment targets (e.g. 'offer')
 * @property productId - id of the purchased product in its respective table
 * @property paymentCodes - array of generated codes { offerId, code } (one per coupon/unit)
 * @property paymentMethod - payment method used (enum)
 * @property status - payment lifecycle state (enum)
 * @property customerEmail/customerFirstName/customerLastName - purchaser contact data
 * @property paymentCode - optional transaction reference (e.g. YAPE/CARD)
 * @property createdAt - ISO timestamp when payment was created
 * @property completedAt - ISO timestamp when payment completed (optional)
 */
export interface Payment extends BaseEntity {
  userId: number;
  cartId: number;
  amount: number;
  // productType indicates which domain/table the payment refers to (e.g., 'offer', 'subscription')
  productType?: string;
  // productId is the id of the purchased product in its respective table
  productId?: number;
  // paymentCodes holds generated codes per purchased item (one per coupon)
  paymentCodes?: { offerId: number; code: string }[];
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  paymentCode?: string; // For Yape or card transaction reference
  createdAt: string;
  completedAt?: string;
}
