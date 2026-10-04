import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Cart } from '../domain/model/cart.entity';
import { CartResource, CartResponse } from './cart-response';
import { CartAssembler } from './cart-assembler';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartApiEndpoint extends BaseApiEndpoint<
  Cart,
  CartResource,
  CartResponse,
  CartAssembler
> {
  constructor(http: HttpClient) {
    // Use plural `/carts` as defined in the OpenAPI spec
    super(http, `${environment.platformProviderApiBaseUrl}/carts`, new CartAssembler());
  }

  /**
   * Get cart for a user using dedicated backend route: GET /carts/user/{userId}
   */
  getByUser(userId: number) {
    return this.http
      .get<CartResource>(`${this.endpointUrl}/user/${encodeURIComponent(userId)}`)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  /**
   * Add an item to the user's cart using POST /carts/user/{userId}/items
   */
  addItemToUser(userId: number, item: any) {
    return this.http
      .post<CartResource>(`${this.endpointUrl}/user/${encodeURIComponent(userId)}/items`, item)
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  /**
   * Update an item quantity using PUT /carts/user/{userId}/items/{offerId}
   */
  updateItemQuantityByUser(userId: number, offerId: number, body: any) {
    return this.http
      .put<CartResource>(
        `${this.endpointUrl}/user/${encodeURIComponent(userId)}/items/${encodeURIComponent(
          offerId
        )}`,
        body
      )
      .pipe(map((resource) => this.assembler.toEntityFromResource(resource)));
  }

  /**
   * Clear a user's cart using DELETE /carts/user/{userId}
   */
  clearCartForUser(userId: number) {
    return this.http.delete<void>(`${this.endpointUrl}/user/${encodeURIComponent(userId)}`);
  }

  /**
   * Create a cart for a user. API expects `userId` as a query parameter on POST /carts
   */
  createCartForUser(userId: number, resource?: CartResource) {
    const url = `${this.endpointUrl}?userId=${encodeURIComponent(userId)}`;
    return this.http
      .post<CartResource>(url, resource || {})
      .pipe(map((r) => this.assembler.toEntityFromResource(r)));
  }
}
