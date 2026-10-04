import { computed, Injectable, signal, inject } from '@angular/core';
import { retry } from 'rxjs';
import { Coupon } from '../domain/model/coupon.entity';
import { CouponsApi } from '../infrastructure/coupons-api';

/**
 * Application service store for managing coupon state in the 'coupons' bounded context.
 * Handles coupons using Angular signals.
 *
 * This store follows the DDD Hexagonal Architecture pattern with Angular Signals
 * for better performance and type safety.
 */
@Injectable({
  providedIn: 'root'
})
export class CouponsStore {
  private readonly api = inject(CouponsApi);

  // ==================== PRIVATE SIGNALS ====================

  private readonly couponsSignal = signal<Coupon[]>([]);
  private readonly loadingSignal = signal<boolean>(false);
  private readonly errorSignal = signal<string | null>(null);

  // ==================== PUBLIC READONLY SIGNALS ====================

  /**
   * Readonly signal for the list of coupons
   */
  readonly coupons = this.couponsSignal.asReadonly();

  /**
   * Readonly signal indicating if data is loading
   */
  readonly loading = this.loadingSignal.asReadonly();

  /**
   * Readonly signal for the current error message
   */
  readonly error = this.errorSignal.asReadonly();

  // ==================== COMPUTED SIGNALS ====================

  /**
   * Computed signal for the count of coupons
   */
  readonly couponCount = computed(() => this.coupons().length);

  /**
   * Computed signal indicating if there are no coupons
   */
  readonly isEmpty = computed(() => this.couponCount() === 0);

  /**
   * Computed signal indicating if there are coupons
   */
  readonly hasCoupons = computed(() => this.couponCount() > 0);

  // ==================== CONSTRUCTOR ====================

  /**
   * Creates an instance of CouponsStore
   * Note: Initial data loading happens on-demand
   */
  constructor() {
    // No automatic loading - data is loaded on-demand by components
  }

  // ==================== PUBLIC METHODS ====================

  /**
   * Load all coupons
   */
  loadAllCoupons(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getAllCoupons().pipe(retry(2)).subscribe({
      next: coupons => {
        this.couponsSignal.set(coupons);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load coupons'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Load coupons for a specific user
   * @param userId - The ID of the user
   */
  loadCouponsByUser(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getCouponsByUser(userId).pipe(retry(2)).subscribe({
      next: coupons => {
        this.couponsSignal.set(coupons);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load user coupons'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Load all coupons with relations (embedded offer data)
   */
  loadAllCouponsWithRelations(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getAllWithRelations().pipe(retry(2)).subscribe({
      next: coupons => {
        this.couponsSignal.set(coupons);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load coupons with relations'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Load coupons with relations for a specific user
   * @param userId - The ID of the user
   */
  loadCouponsWithRelationsByUser(userId: number): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.getAllWithRelationsByUser(userId).pipe(retry(2)).subscribe({
      next: coupons => {
        this.couponsSignal.set(coupons);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to load user coupons with relations'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Create a single coupon
   * @param coupon - Coupon data without ID
   */
  createCoupon(coupon: Omit<Coupon, 'id'>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.createCoupon(coupon).pipe(retry(2)).subscribe({
      next: createdCoupon => {
        this.couponsSignal.update(coupons => [...coupons, createdCoupon]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create coupon'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Create multiple coupons at once
   * @param coupons - Array of coupon data without IDs
   */
  createManyCoupons(coupons: Array<Omit<Coupon, 'id'>>): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);

    this.api.createMany(coupons).pipe(retry(2)).subscribe({
      next: createdCoupons => {
        this.couponsSignal.update(existing => [...existing, ...createdCoupons]);
        this.loadingSignal.set(false);
      },
      error: err => {
        this.errorSignal.set(this.formatError(err, 'Failed to create coupons'));
        this.loadingSignal.set(false);
      }
    });
  }

  /**
   * Clear all coupons from state
   */
  clearCoupons(): void {
    this.couponsSignal.set([]);
    this.errorSignal.set(null);
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.errorSignal.set(null);
  }

  // ==================== PRIVATE HELPER METHODS ====================

  /**
   * Format error messages for user-friendly display
   * @param error - The error object
   * @param defaultMessage - Default message if error is not descriptive
   * @returns Formatted error message
   */
  private formatError(error: any, defaultMessage: string): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return defaultMessage;
  }
}
