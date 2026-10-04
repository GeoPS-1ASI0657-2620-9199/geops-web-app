import { BaseResponse, BaseResource } from '../../shared/infrastructure/base-response';
import { PaymentMethod, PaymentStatus } from '../domain/model/payment-method.enum';

/**
 * Resource representation of a payment
 * extends BaseResource
 * @property userId - ID of the user who made the payment
 * @property cartId - ID of the cart associated with the payment
 * @property amount - Amount paid
 * @property paymentMethod - Method of payment used (enum)
 * @property status - Current status of the payment (enum)
 * @property customerEmail - Email of the customer
 * @property customerFirstName - First name of the customer
 * @property customerLastName - Last name of the customer
 * @property paymentCode - (optional) Transaction reference code
 * @property createdAt - Creation timestamp of the payment
 * @property completedAt - (optional) Completion timestamp of the payment
 */
export interface PaymentResource extends BaseResource {
  userId: number;
  cartId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  paymentCode?: string;
  createdAt: string;
  completedAt?: string;
}

/**
 * Response structure for multiple payments
 * extends BaseResponse
 * @property data - Array of PaymentResource objects
 */
export interface PaymentResponse extends BaseResponse {
  data: PaymentResource[];
}
