import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CouponListComponent } from '../../../../coupons/presentation/components/coupon-list/coupon-list';
import { TranslateModule } from '@ngx-translate/core';
import { CouponsStore } from '../../../../coupons/application/coupons.store';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';

/**
 * Mis Cupones Component
 *
 * Displays the current user's coupons using the CouponsStore.
 * Loads coupons with embedded offer relations on initialization.
 */
@Component({
  selector: 'app-mis-cupones',
  standalone: true,
  imports: [CommonModule, CouponListComponent, TranslateModule],
  templateUrl: './mis-cupones.component.html',
  styleUrls: ['./mis-cupones.component.css'],
})
export class MisCuponesComponent implements OnInit {
  private readonly couponsStore = inject(CouponsStore);
  private readonly authService = inject(AuthService);

  /**
   * Initialize component and load user's coupons
   */
  ngOnInit(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId !== null && userId !== undefined) {
      // Load coupons for current user including expanded offer data
      this.couponsStore.loadCouponsWithRelationsByUser(userId);
    }
  }
}
