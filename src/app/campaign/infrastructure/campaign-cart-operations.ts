import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, forkJoin, of, catchError, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CartApi } from '../../cart/infrastructure/cart-api';

/**
 * Infrastructure service for cross-bounded-context operations
 * between Campaign and Cart contexts.
 *
 * Handles cart cleanup when campaigns change status or are deleted.
 */
@Injectable({
  providedIn: 'root'
})
export class CampaignCartOperations {
  private readonly http = inject(HttpClient);
  private readonly cartApi = inject(CartApi);

  /**
   * Remove all offers associated with a campaign from all user carts
   * @param campaignId - The ID of the campaign whose offers should be removed
   * @returns Observable that completes when all cart items are removed
   *
   * Process:
   * 1. Fetch all offers belonging to the campaign
   * 2. Fetch all carts in the system
   * 3. For each cart, identify items that match the campaign's offers
   * 4. Remove matching items from each cart
   */
  removeOffersFromAllCarts(campaignId: number): Observable<void> {
    // 1. Get all offers from this campaign
    return this.http.get<any[]>(`${environment.platformProviderApiBaseUrl}/offers/campaign/${campaignId}`).pipe(
      switchMap(offers => {
        if (!offers || offers.length === 0) {
          return of(undefined);
        }

        const offerIds = offers.map(o => o.id);

        // 2. Get all carts
        return this.http.get<any[]>(`${environment.platformProviderApiBaseUrl}/carts`).pipe(
          switchMap(carts => {
            if (!carts || carts.length === 0) {
              return of(undefined);
            }

            // 3. For each cart, remove items that match the offer IDs
            const removeOperations = carts
              .filter(cart => cart.items && cart.items.length > 0)
              .map(cart => {
                const itemsToRemove = cart.items.filter((item: any) => offerIds.includes(item.offerId));

                if (itemsToRemove.length === 0) {
                  return of(null);
                }

                // Remove each item from the cart using CartApi
                const removeRequests = itemsToRemove.map((item: any) =>
                  this.cartApi.removeItemFromCart(cart.userId, item.offerId).pipe(
                    catchError(err => {
                      console.warn(`[CampaignCartOperations] Error removing offer ${item.offerId} from cart ${cart.userId}:`, err);
                      return of(null);
                    })
                  )
                );

                return forkJoin(removeRequests);
              });

            if (removeOperations.length === 0) {
              return of(undefined);
            }

            return forkJoin(removeOperations).pipe(map(() => undefined));
          }),
          catchError(err => {
            console.error('[CampaignCartOperations] Error fetching carts:', err);
            return of(undefined);
          })
        );
      }),
      catchError(err => {
        console.error('[CampaignCartOperations] Error fetching offers:', err);
        return of(undefined);
      })
    );
  }
}
