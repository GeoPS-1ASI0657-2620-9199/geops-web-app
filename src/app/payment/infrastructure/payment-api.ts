import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, BehaviorSubject, of, switchMap, take } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Payment } from '../domain/model/payment.entity';
import { PaymentApiEndpoint } from './payment-api-endpoint';
import { PaymentMethod, PaymentStatus } from '../domain/model/payment-method.enum';
import { CouponsApi } from '../../coupons/infrastructure/coupons-api';
import { CartApi } from '../../cart/infrastructure/cart-api';
import { Cart } from '../../cart/domain/model/cart.entity';
import { CartItem } from '../../cart/domain/model/cart-item.entity';
import { Coupon } from '../../coupons/domain/model/coupon.entity';

/**
 * PurchaseItem
 *
 * Minimal representation of an item included in a payment. Used to generate
 * one or more coupon/payment codes per purchased unit.
 */
export interface PurchaseItem {
  offerId: number;
  price: number;
  quantity?: number;
}

export interface CreatePaymentRequest {
  userId: number;
  cartId: number;
  amount: number;
  productType?: string;
  productId?: number;
  // items indicates what was purchased; we'll generate a coupon per item.offerId
  items?: Array<PurchaseItem>;
  paymentMethod: PaymentMethod;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  cvv?: string; // Only for card payments, not stored
}

/**
 * Creates a payment request describing the data required to process a payment.
 * See `createPayment` for the behavior applied when this request is processed.
 */

@Injectable({
  providedIn: 'root'
})
export class PaymentApi extends BaseApi {
  private readonly paymentEndpoint: PaymentApiEndpoint;
  private paymentsSubject = new BehaviorSubject<Payment[]>([]);
  public payments$ = this.paymentsSubject.asObservable();

  constructor(http: HttpClient, private couponsApi: CouponsApi, private cartApi: CartApi) {
    super();
    this.paymentEndpoint = new PaymentApiEndpoint(http);
  }

  /**
    * Creates a new payment and generates coupons for purchased items.
    *
    * Behavior:
    * - Determines purchased items from `request.items` or the user's cart.
    * - Generates a `paymentCode` for the transaction and a `paymentCodes` array
    *   containing a generated coupon code for each purchased unit (respects `quantity`).
    * - Persists the Payment record via the payments endpoint.
    * - After the payment is persisted, creates coupons based on the generated
    *   payment codes by calling `CouponsApi.createMany(...)`. If the backend
    *   does not support a bulk endpoint, the client will fall back to serial
    *   creation of coupons and wait for each POST to complete before proceeding.
    *
    * Returns an Observable that emits the persisted `Payment` after coupon
    * creation has completed (or immediately if no coupons were generated).
    *
    * @param request - Payment creation request
   */
  createPayment(request: CreatePaymentRequest): Observable<Payment> {
    // Determine items either from request or from the user's cart
    const items$ = request.items && request.items.length > 0
        ? of(request.items)
        : this.cartApi.getCartByUserId(request.userId).pipe(
            map((cart: Cart) => cart.items.map((i: CartItem) => ({ offerId: i.offerId, price: i.offerPrice, quantity: i.quantity })))
          );

    return items$.pipe(
      take(1),
      switchMap((items) => {
        // Generate a payment code for tracking
        const paymentCode = this.generatePaymentCode(request.paymentMethod);

        // Generate per-item payment codes (one coupon per purchased unit)
        const paymentCodes: { offerId: number; code: string }[] = [];
        if (items && items.length > 0) {
          for (const it of items) {
            const qty = (it.quantity && it.quantity > 0) ? it.quantity : 1;
            for (let k = 0; k < qty; k++) {
              const code = this.generateRandomCouponCode();
              paymentCodes.push({ offerId: it.offerId, code });
            }
          }
        }

        const newPayment: Omit<Payment, 'id'> = {
          userId: request.userId,
          cartId: request.cartId,
          productType: request.productType,
          productId: request.productId,
          amount: request.amount,
          paymentCodes: paymentCodes,
          paymentMethod: request.paymentMethod,
          status: PaymentStatus.COMPLETED, // For demo purposes, always successful
          customerEmail: request.customerEmail,
          customerFirstName: request.customerFirstName,
          customerLastName: request.customerLastName,
          paymentCode: paymentCode,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString()
        };

        return this.paymentEndpoint.create(newPayment as Payment).pipe(
          switchMap(payment => {
            const currentPayments = this.paymentsSubject.value;
            this.paymentsSubject.next([...currentPayments, payment]);

            // Call completePayment endpoint to trigger notification creation
            return this.paymentEndpoint.completePayment(payment.id).pipe(
              switchMap(completedPayment => {
                // After payment completed, create coupons for each generated payment code
                if (paymentCodes.length > 0) {
                  const couponsPayload = paymentCodes.map(pc => ({
                    userId: request.userId,
                    paymentId: completedPayment.id,
                    paymentCode: pc.code,
                    productType: request.productType,
                    offerId: pc.offerId,
                    code: pc.code,
                    createdAt: new Date().toISOString()
                  } as Omit<Coupon, 'id'>));

                  // Use bulk create to avoid flooding the server with many requests. CouponsApi.createMany will
                  // attempt the bulk endpoint and fall back to a throttled per-item creation if unavailable.
                  return this.couponsApi.createMany(couponsPayload).pipe(
                    map(() => completedPayment)
                  );
                }

                return of(completedPayment);
              })
            );
          })
        );
      })
    );
  }

  /**
   * Generate a short random coupon code.
   *
   * The code is produced by taking a base36 representation of a random number,
   * extracting a substring and converting to upper-case. Resulting codes are
   * 6 characters long, containing the characters 0-9 and A-Z.
   *
   * Notes:
   * - This method is intended for lightweight demo codes and is not
   *   cryptographically secure. For production use consider a server-side
   *   generator with uniqueness guarantees or use UUIDs with a display-safe
   *   transformation.
   * - Collisions are possible; the system creates one coupon per purchased
   *   unit, and the persistence layer should enforce uniqueness if required.
   *
   * @returns A 6-character alphanumeric uppercase coupon code.
   */
  private generateRandomCouponCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Gets payment by ID
   * @param id - Payment ID
   */
  getPaymentById(id: number): Observable<Payment> {
    return this.paymentEndpoint.getById(id);
  }

  /**
   * Gets payments by user ID
   * @param userId - User ID
   */
  getPaymentsByUser(userId: number): Observable<Payment[]> {
    return this.paymentEndpoint.getAll().pipe(
      map((payments: Payment[]) => payments.filter(payment => payment.userId === userId)),
      tap(userPayments => this.paymentsSubject.next(userPayments))
    );
  }

  /**
   * Gets all payments
   */
  getAllPayments(): Observable<Payment[]> {
    return this.paymentEndpoint.getAll().pipe(
      tap(payments => this.paymentsSubject.next(payments))
    );
  }

  private generatePaymentCode(paymentMethod: PaymentMethod): string {
    let prefix: string;
    switch (paymentMethod) {
      case PaymentMethod.YAPE:
        prefix = 'YAPE';
        break;
      case PaymentMethod.PLIN:
        prefix = 'PLIN';
        break;
      case PaymentMethod.CARD:
      default:
        prefix = 'CARD';
        break;
    }
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${random}`;
  }
}
