import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { CouponItemComponent } from '../coupon-item/coupon-item';
import { CouponsStore } from '../../../application/coupons.store';

/**
 * Coupon List Component
 *
 * Displays a list of coupons using the CouponsStore for state management.
 * Uses Angular Signals for reactive state.
 */
@Component({
  selector: 'app-coupon-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, CouponItemComponent],
  templateUrl: './coupon-list.html',
  styleUrls: ['./coupon-list.css'],
})
export class CouponListComponent {
  // Inject store
  protected readonly store = inject(CouponsStore);

  // Expose store signals for template
  readonly coupons = this.store.coupons;
  readonly loading = this.store.loading;
  readonly error = this.store.error;
  readonly isEmpty = this.store.isEmpty;
}
