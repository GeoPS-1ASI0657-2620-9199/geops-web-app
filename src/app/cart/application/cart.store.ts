import { computed, Injectable, Signal, signal, inject } from '@angular/core';
import { retry } from 'rxjs';
import { Cart } from '../domain/model/cart.entity';
import { CartItem } from '../domain/model/cart-item.entity';
import { CartApi } from '../infrastructure/cart-api';

/**
 * Application service store for managing cart state in the 'cart' bounded context.
 * Handles cart and cart items using Angular signals.
 *
 * This store follows the DDD Hexagonal Architecture pattern with Angular Signals
 * for better performance and type safety.
 */
@Injectable({
  providedIn: 'root'
})
export class CartStore {
  private readonly api = inject(CartApi);

  // ==================== PRIVATE SIGNALS ====================

  private readonly cartSignal = signal<Cart | null>(null);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);
  private readonly sidebarOpenSignal = signal<boolean>(false);

  // ==================== PUBLIC READONLY SIGNALS ====================

  /**
   * Readonly signal for the current cart
   */
  readonly cart = this.cartSignal.asReadonly();

  /**
   * Readonly signal indicating if data is loading
   */
  readonly loading = this.loadingSignal.asReadonly();

  /**
   * Readonly signal for the current error message
   */
  readonly error = this.errorSignal.asReadonly();

  /**
   * Readonly signal for sidebar open state
   */
  readonly sidebarOpen = this.sidebarOpenSignal.asReadonly();

  // ==================== COMPUTED SIGNALS ====================

  /**
   * Computed signal for cart items
   */
  readonly items = computed(() => this.cart()?.items || []);

  /**
   * Computed signal for total items count
   */
  readonly totalItems = computed(() => this.cart()?.totalItems || 0);

  /**
   * Computed signal for total amount
   */
  readonly totalAmount = computed(() => this.cart()?.totalAmount || 0);

  /**
   * Computed signal indicating if cart is empty
   */
  readonly isEmpty = computed(() => this.totalItems() === 0);

  /**
   * Computed signal indicating if cart has items
   */
  readonly hasItems = computed(() => this.totalItems() > 0);

  // ==================== CONSTRUCTOR ====================

  /**
   * Creates an instance of CartStore
   * Note: Initial data loading happens on-demand via loadCartByUserId
   */
  constructor() {
    // No automatic loading - data is loaded on-demand by components
  }

  // ==================== CART METHODS ====================

  /**
   * Load cart for a specific user
   * @param userId - The ID of the user
   */
  loadCartByUserId(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getCartByUserId(userId).pipe(retry(2)).subscribe({
      next: cart => {
        this.cartSignal.set(cart);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load cart'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Add item to cart
   * @param userId - User ID
   * @param offerId - Offer ID
   * @param offerTitle - Offer title
   * @param offerPrice - Offer price
   * @param offerImageUrl - Offer image URL
   * @param quantity - Quantity to add
   */
  addItem(
    userId: number,
    offerId: number,
    offerTitle: string,
    offerPrice: number,
    offerImageUrl: string,
    quantity: number = 1
  ): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.addItemToCart(userId, offerId, offerTitle, offerPrice, offerImageUrl, quantity)
      .pipe(retry(2))
      .subscribe({
        next: cart => {
          this.cartSignal.set(cart);
          this.loadingSignal.set(false);
          // Auto-open sidebar when item is added
          this.openSidebar();
        },
        error: err => {
          this.errorSignal.set(this.formatError(err, 'Failed to add item to cart'));
          this.loadingSignal.set(false);
        }
      });
  }

  /**
   * Update item quantity
   * @param userId - User ID
   * @param offerId - Offer ID
   * @param quantity - New quantity
   */
  updateItemQuantity(userId: number, offerId: number, quantity: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.updateItemQuantity(userId, offerId, quantity).pipe(retry(2)).subscribe({
      next: cart => {
        this.cartSignal.set(cart);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to update item quantity'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Remove item from cart
   * @param userId - User ID
   * @param offerId - Offer ID to remove
   */
  removeItem(userId: number, offerId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.removeItemFromCart(userId, offerId).pipe(retry(2)).subscribe({
      next: cart => {
        this.cartSignal.set(cart);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to remove item from cart'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Clear entire cart
   * @param userId - User ID
   */
  clearCart(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.clearCart(userId).pipe(retry(2)).subscribe({
      next: cart => {
        this.cartSignal.set(cart);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to clear cart'));
        this.loadingSignal.set(false);
      }
    });
  }

  // ==================== SIDEBAR METHODS ====================

  /**
   * Open cart sidebar
   */
  openSidebar(): void {
    this.sidebarOpenSignal.set(true);
  }

  /**
   * Close cart sidebar
   */
  closeSidebar(): void {
    this.sidebarOpenSignal.set(false);
  }

  /**
   * Toggle cart sidebar
   */
  toggleSidebar(): void {
    this.sidebarOpenSignal.update(open => !open);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check if an offer is in the cart
   * @param offerId - Offer ID to check
   */
  hasOffer(offerId: number): boolean {
    return this.items().some(item => item.offerId === offerId);
  }

  /**
   * Get quantity of a specific offer in cart
   * @param offerId - Offer ID
   */
  getOfferQuantity(offerId: number): number {
    const item = this.items().find(item => item.offerId === offerId);
    return item?.quantity || 0;
  }

  /**
   * Get cart item by offer ID
   * @param offerId - Offer ID
   */
  getItemByOfferId(offerId: number): Signal<CartItem | undefined> {
    return computed(() => this.items().find(item => item.offerId === offerId));
  }

  // ==================== PRIVATE METHODS ====================

  /**
   * Format error messages for user-friendly display
   * @param error - The error object
   * @param fallback - The fallback error message
   * @returns A formatted error message
   */
  private formatError(error: any, fallback: string): string {
    if (error instanceof Error) {
      return error.message.includes('Resource not found')
        ? `${fallback}: Not found`
        : error.message;
    }
    return fallback;
  }
}
