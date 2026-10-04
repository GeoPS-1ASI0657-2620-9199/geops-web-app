import { Injectable } from '@angular/core';
import { Observable, map, from, lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Coupon } from '../domain/model/coupon.entity';
import { CouponsApiEndpoint } from './coupons-api-endpoint';
import { environment } from '../../../environments/environment';
import { CouponsAssembler } from './coupons-assembler';
import { CouponResource, CouponsResponse } from './coupons-response';

/**
 * Infrastructure service for coupon HTTP operations.
 *
 * This service handles all HTTP communication with the backend API for coupons.
 * State management is handled by CouponsStore in the application layer.
 */
@Injectable({ providedIn: 'root' })
export class CouponsApi extends BaseApi {
  private readonly endpoint: CouponsApiEndpoint;

  constructor(private http: HttpClient) {
    super();
    this.endpoint = new CouponsApiEndpoint(http);
  }

  /**
   * Create multiple coupons in a single request.
   *
   * Tries to create multiple coupons using the backend bulk endpoints exposed in
   * the OpenAPI definition. Order of attempts:
   *  1. POST /coupons/bulk            -> expects an array of coupon resources
   *  2. POST /coupons/bulk-wrapped    -> expects an object like { coupons: [...] }
   * If both bulk endpoints are unavailable the method falls back to creating
   * coupons sequentially (awaiting each POST) to avoid overwhelming the server.
   */
  createMany(coupons: Array<Omit<Coupon, 'id'>>): Observable<Coupon[]> {
    const assembler = new CouponsAssembler();

    const asyncOp = async (): Promise<Coupon[]> => {
      // 1) Try the simple bulk endpoint that accepts an array
      try {
        const bulkUrl = `${environment.platformProviderApiBaseUrl}/coupons/bulk`;
        const response = await lastValueFrom(
          this.http.post<CouponResource[] | CouponsResponse>(bulkUrl, coupons)
        );
        return Array.isArray(response)
          ? response.map((r) => assembler.toEntityFromResource(r as CouponResource))
          : assembler.toEntitiesFromResponse(response as CouponsResponse);
      } catch (errBulk) {
        // 2) Try an alternative wrapped bulk endpoint
        try {
          const wrappedUrl = `${environment.platformProviderApiBaseUrl}/coupons/bulk-wrapped`;
          const wrappedBody = { coupons };
          const resp = await lastValueFrom(
            this.http.post<CouponsResponse | { coupons: CouponResource[] }>(wrappedUrl, wrappedBody)
          );
          if (Array.isArray((resp as any).coupons)) {
            return (resp as any).coupons.map((r: CouponResource) =>
              assembler.toEntityFromResource(r)
            );
          }
          return assembler.toEntitiesFromResponse(resp as CouponsResponse);
        } catch (errWrapped) {
          // 3) Fallback: sequentially create each coupon and wait for completion
          const createdSequential: Coupon[] = [];
          for (const c of coupons) {
            try {
              const createdCoupon = await lastValueFrom(this.createCoupon(c));
              createdSequential.push(createdCoupon);
            } catch (e) {
              // keep going on error to maximize created coupons
            }
          }
          return createdSequential;
        }
      }
    };

    return from(asyncOp());
  }

  /**
   * Get all coupons
   * @returns Observable of all coupons
   */
  getAllCoupons(): Observable<Coupon[]> {
    return this.endpoint.getAll();
  }

  /**
   * Get coupons filtered by user ID
   * @param userId - The user ID to filter by
   * @returns Observable of user's coupons
   */
  getCouponsByUser(userId: number): Observable<Coupon[]> {
    return this.endpoint.getAll().pipe(
      map((coupons: Coupon[]) => coupons.filter((c) => c.userId === userId))
    );
  }

  /**
   * Create a single coupon
   * @param coupon - Coupon data without ID
   * @returns Observable of created coupon
   */
  createCoupon(coupon: Omit<Coupon, 'id'>): Observable<Coupon> {
    return this.endpoint.create(coupon as Coupon);
  }

  /**
   * Fetch coupons including related resources using the backend's dedicated endpoint.
   * The server now exposes a route that returns coupon resources with relations populated,
   * so the client should not append `_expand` or `_embed` query parameters.
   * @returns Observable of coupons with embedded relations
   */
  getAllWithRelations(): Observable<Coupon[]> {
    const url = `${environment.platformProviderApiBaseUrl}/coupons`;
    const assembler = new CouponsAssembler();

    return this.http.get<CouponResource[] | CouponsResponse>(url).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((r) => assembler.toEntityFromResource(r as CouponResource));
        }
        return assembler.toEntitiesFromResponse(response as CouponsResponse);
      })
    );
  }

  /**
   * Fetch coupons for a specific user. Uses the dedicated backend route:
   * GET /coupons/user/{userId} which returns coupons (optionally with relations).
   * @param userId - User ID to filter coupons
   * @returns Observable of user's coupons with embedded relations
   */
  getAllWithRelationsByUser(userId: number): Observable<Coupon[]> {
    const url = `${environment.platformProviderApiBaseUrl}/coupons/user/${encodeURIComponent(
      userId
    )}`;
    const assembler = new CouponsAssembler();

    return this.http.get<CouponResource[] | CouponsResponse>(url).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response.map((r) => assembler.toEntityFromResource(r as CouponResource));
        }
        return assembler.toEntitiesFromResponse(response as CouponsResponse);
      })
    );
  }
}
