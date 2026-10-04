import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, map, tap, switchMap, of, catchError } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Cart } from '../domain/model/cart.entity';
import { CartItem } from '../domain/model/cart-item.entity';
import { CartApiEndpoint } from './cart-api-endpoint';
import { HttpClient } from '@angular/common/http';
import { CartItemResource, CartResource } from './cart-response';
import { CartAssembler } from './cart-assembler';

@Injectable({
  providedIn: 'root',
})
export class CartApi extends BaseApi {
  private readonly cartEndpoint: CartApiEndpoint;
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();
  // Cache in-flight requests per user to avoid duplicate HTTP calls
  private inFlightRequests = new Map<number, Observable<Cart>>();

  constructor(http: HttpClient) {
    super();
    this.cartEndpoint = new CartApiEndpoint(http);
  }

  /**
   * Get cart for a specific user
   * @param userId - User ID
   */
  getCartByUserId(userId: number): Observable<Cart> {
    // If we already have a cart cached for this user, return it synchronously
    const cached = this.cartSubject.value;
    if (cached && cached.userId === userId) {
      return new Observable<Cart>((subscriber) => {
        subscriber.next(cached);
        subscriber.complete();
      });
    }

    // If there's an in-flight request for this user, return it
    if (this.inFlightRequests.has(userId)) {
      return this.inFlightRequests.get(userId)!;
    }

    // Use dedicated endpoint to fetch user's cart
    const req$ = this.cartEndpoint.getByUser(userId).pipe(
      map((cart) => {
        if (cart) return cart;
        return {
          id: 0,
          userId,
          items: [],
          totalItems: 0,
          totalAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Cart;
      }),
      catchError((error) => {
        // If cart doesn't exist (404 or any error), return empty cart
        return of({
          id: 0,
          userId,
          items: [],
          totalItems: 0,
          totalAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Cart);
      }),
      tap((cart) => this.cartSubject.next(cart))
    );

    // Store in-flight request with share to avoid multiple executions
    const shared$ = req$;
    this.inFlightRequests.set(userId, shared$);

    // Clean up cache when the request completes
    shared$.subscribe({
      next: () => this.inFlightRequests.delete(userId),
      error: () => this.inFlightRequests.delete(userId),
      complete: () => this.inFlightRequests.delete(userId),
    });

    return shared$;
  }

  /**
   * Add item to cart
   * @param userId - User ID
   * @param offerId - Offer ID to add
   * @param offerTitle - Offer title
   * @param offerPrice - Offer price
   * @param offerImageUrl - Offer image URL
   * @param quantity - Quantity to add
   */
  addItemToCart(
    userId: number,
    offerId: number,
    offerTitle: string,
    offerPrice: number,
    offerImageUrl: string,
    quantity: number = 1
  ): Observable<Cart> {
    // Use server-side add/update item endpoints when possible
    return this.getCartByUserId(userId).pipe(
      switchMap((cart) => {
        // If cart doesn't exist (id === 0), create it first
        if (cart.id === 0) {
          const assembler = new CartAssembler();
          const resource = assembler.toResourceFromEntity(cart);
          return this.cartEndpoint.createCartForUser(userId, resource).pipe(
            tap((createdCart) => this.cartSubject.next(createdCart)),
            switchMap((createdCart) => {
              // Now add the item to the newly created cart
              const itemResource: CartItemResource = {
                id: Date.now(),
                userId,
                offerId,
                offerTitle,
                offerPrice,
                offerImageUrl,
                quantity,
                total: quantity * offerPrice,
              };
              return this.cartEndpoint
                .addItemToUser(userId, itemResource)
                .pipe(tap((c) => this.cartSubject.next(c)));
            })
          );
        }

        const existingItem = cart.items.find((item) => item.offerId === offerId);
        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity;
          return this.cartEndpoint
            .updateItemQuantityByUser(userId, offerId, { quantity: newQuantity })
            .pipe(tap((c) => this.cartSubject.next(c)));
        }

        const itemResource: CartItemResource = {
          id: Date.now(),
          userId,
          offerId,
          offerTitle,
          offerPrice,
          offerImageUrl,
          quantity,
          total: quantity * offerPrice,
        };
        return this.cartEndpoint
          .addItemToUser(userId, itemResource)
          .pipe(tap((c) => this.cartSubject.next(c)));
      })
    );
  }

  /**
   * Update item quantity in cart
   * @param userId - User ID
   * @param offerId - Offer ID
   * @param quantity - New quantity
   */
  updateItemQuantity(userId: number, offerId: number, quantity: number): Observable<Cart> {
    // Use backend route to update item quantity which returns the new cart
    return this.cartEndpoint
      .updateItemQuantityByUser(userId, offerId, { quantity })
      .pipe(tap((c) => this.cartSubject.next(c)));
  }

  /**
   * Remove item from cart
   * @param userId - User ID
   * @param offerId - Offer ID to remove
   */
  removeItemFromCart(userId: number, offerId: number): Observable<Cart> {
    return this.updateItemQuantity(userId, offerId, 0);
  }

  /**
   * Clear entire cart
   * @param userId - User ID
   */
  clearCart(userId: number): Observable<Cart> {
    // Call the dedicated clear endpoint and then set local state to an empty cart
    return this.cartEndpoint.clearCartForUser(userId).pipe(
      switchMap(() => {
        const empty: Cart = {
          id: 0,
          userId,
          items: [],
          totalItems: 0,
          totalAmount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        this.cartSubject.next(empty);
        return of(empty);
      })
    );
  }

  /**
   * Update cart in backend
   * @param cart - Cart to update
   */
  private updateCart(cart: Cart): Observable<Cart> {
    const assembler = new CartAssembler();
    if (cart.id === 0) {
      // Create cart for user using API that expects userId as query parameter
      const resource: CartResource = assembler.toResourceFromEntity(cart);
      return this.cartEndpoint.createCartForUser(cart.userId, resource);
    }

    // Update existing cart by id
    return this.cartEndpoint.update(cart, cart.id);
  }

  /**
   * Get current cart count
   */
  getCartCount(): Observable<number> {
    return this.cart$.pipe(map((cart) => cart?.totalItems || 0));
  }
}
