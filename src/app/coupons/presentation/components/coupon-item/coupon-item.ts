import { Component, Input, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { OffersApiEndpoint } from '../../../../loyalty/infrastructure/offers/offers-api-endpoint';
import { Coupon } from '../../../domain/model/coupon.entity';

/**
 * Coupon Item Component
 *
 * Displays a single coupon with its details including offer information and payment date.
 * Allows users to copy the coupon code to clipboard.
 */
@Component({
  selector: 'app-coupon-item',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './coupon-item.html',
  styleUrls: ['./coupon-item.css']
})
export class CouponItemComponent implements OnInit {
  @Input() coupon: Coupon | any = {};

  title?: string;
  offerPrice?: number;
  paymentDate?: string;

  private readonly offersApi = inject(OffersApiEndpoint);

  ngOnInit(): void {
    // Prefer embedded offer data when available to avoid extra HTTP calls
    if (this.coupon && this.coupon.offer) {
      this.title = this.coupon.offer.title;
      this.offerPrice = this.coupon.offer.price;
    } else if (this.coupon && this.coupon.productType === 'offer' && this.coupon.offerId) {
      // fallback: fetch offer data by id
      const id = Number(this.coupon.offerId);
      if (!isNaN(id)) {
        this.offersApi.getByIds([id]).subscribe(list => {
          if (list && list.length > 0) this.title = list[0].title;
          if (list && list.length > 0) this.offerPrice = list[0].price;
        });
      }
    }

    // derive a human-friendly payment date if available
    if (this.coupon && this.coupon.createdAt) {
      try {
        this.paymentDate = new Date(this.coupon.createdAt).toLocaleDateString();
      } catch (e) {
        // ignore invalid date
      }
    }
  }

  /**
   * Copy coupon code to clipboard
   */
  copy(): void {
    try {
      navigator.clipboard.writeText(this.coupon.code);
    } catch(e) {
      console.warn('Copy failed', e);
    }
  }
}
