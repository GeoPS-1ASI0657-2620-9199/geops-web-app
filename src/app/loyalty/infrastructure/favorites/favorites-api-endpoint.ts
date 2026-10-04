import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { FavoriteRow } from './favorites-assembler';
import { FavoriteRowResource, FavoriteRowsResponse } from './favorites-response';
import { FavoritesAssembler } from './favorites-assembler';
import { catchError, map, Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FavoritesApiEndpoint extends BaseApiEndpoint<
  FavoriteRow,
  FavoriteRowResource,
  FavoriteRowsResponse,
  FavoritesAssembler
> {
  /**
   * creates an instance of the favoritesApiEndpoint service
   * @param http - angular http client
   */
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}/favorites`, new FavoritesAssembler());
  }

  /**
   * gets the user's favorite rows
   * @param userId - user id
   */
  getByUser(userId: number): Observable<FavoriteRow[]> {
    // El backend espera userId como string
    const url = `${this.endpointUrl}?userId=${(userId)}`;

    return this.http
      .get<any>(url)
      .pipe(
        map(response => {
          const list = Array.isArray(response) ? response : (response.content || response.data || []);
          return list.map((r: FavoriteRowResource) => this.assembler.toEntityFromResource(r));
        }),
        catchError(error => {
          console.error('[FavoritesAPI] Error getting favorites:', error.status, error.message);
          return of([]);
        })
      );
  }

  /**
   * search for a specific user favorite
   * @param userId - user id
   * @param offerId - offer id
   */
  findRow(userId: number, offerId: number): Observable<FavoriteRow[]> {
    // El backend espera userId y offerId como strings
    const url = `${this.endpointUrl}?userId=${(userId)}&offerId=${(offerId)}`;

    return this.http
      .get<any>(url)
      .pipe(
        map(response => {
          const list = Array.isArray(response) ? response : (response.content || response.data || []);
          return list.map((r: FavoriteRowResource) => this.assembler.toEntityFromResource(r));
        }),
        catchError(error => {
          console.error('[FavoritesAPI] Error finding favorite:', error.status, error.message);
          return of([]);
        })
      );
  }

  /**
   * create a new favorites row
   * @param userId
   * @param offerId
   */
  add(userId: number, offerId: number): Observable<FavoriteRow> {
    // El backend espera userId y offerId como strings
    const body = {
      userId: (userId),
      offerId: (offerId)
    };

    return this.http
      .post<FavoriteRowResource>(`${this.endpointUrl}`, body)
      .pipe(
        map(r => this.assembler.toEntityFromResource(r)),
        catchError(error => {
          // Si el error es 400, probablemente el favorito ya existe
          if (error.status === 400) {
            console.warn('[FavoritesAPI] Favorite may already exist:', body);
            // Intentar obtener el favorito existente
            return this.findRow(userId, offerId).pipe(
              map(rows => {
                if (rows.length > 0) {
                  return rows[0];
                }
                throw error;
              })
            );
          }
          console.error('[FavoritesAPI] Error adding favorite:', error.status, error.message);
          throw error;
        })
      );
  }

  /**
   * delete the favorite by ID
   * @param rowId - ID of the favorite row
   */
  removeRow(rowId: number): Observable<void> {
    return this.http.delete<void>(`${this.endpointUrl}/${rowId}`);
  }

  /**
   * delete the favorite by userId and offerId
   * Uses the DELETE /favorites endpoint with body (from backend)
   * @param userId - user ID
   * @param offerId - offer ID
   */
  removeByUserAndOffer(userId: number, offerId: number): Observable<void> {
    const body = {
      userId: (userId),
      offerId: (offerId)
    };

    return this.http.request<void>('DELETE', this.endpointUrl, { body });
  }
}
