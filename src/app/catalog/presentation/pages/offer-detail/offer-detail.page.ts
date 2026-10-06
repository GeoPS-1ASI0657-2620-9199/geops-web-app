import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoLocationPicker } from '../../../../shared/ui/geo-location-picker/geo-location-picker';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { GetOfferDetailUseCase } from '../../../application/get-offer-detail.use-case';
import { OfferDetail } from '../../../domain/model/offer-detail';
import { validityLabel } from '../../validity-label';

const OFFER_NOT_FOUND = 'OFFER_NOT_FOUND';
type ViewState = 'loading' | 'ready' | 'not-found' | 'error';

/** Offer detail with its loading, not found, error and not available states (US04, GEO-98). */
@Component({
  selector: 'app-offer-detail',
  standalone: true,
  imports: [
    DecimalPipe,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    TranslateModule,
    GeoAlert,
    GeoEmptyState,
    GeoLocationPicker,
    GeoSeal,
  ],
  templateUrl: './offer-detail.page.html',
  styleUrl: './offer-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferDetailPage implements OnInit {
  private readonly getOfferDetail = inject(GetOfferDetailUseCase);
  private readonly offerId = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));

  protected readonly state = signal<ViewState>('loading');
  protected readonly offer = signal<OfferDetail | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly validity = computed(() => {
    const offer = this.offer();
    return offer ? validityLabel(offer.validTo) : '';
  });
  /** Walking directions on OpenStreetMap, the same map stack as the rest of the app. */
  protected readonly directionsUrl = computed(() => {
    const offer = this.offer();
    if (!offer) {
      return null;
    }
    const { latitude, longitude } = offer.location;
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=%3B${latitude}%2C${longitude}`;
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    if (!Number.isInteger(this.offerId) || this.offerId <= 0) {
      this.state.set('not-found');
      return;
    }
    this.state.set('loading');
    try {
      this.offer.set(await this.getOfferDetail.execute(this.offerId));
      this.state.set('ready');
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      if (apiError?.code === OFFER_NOT_FOUND) {
        this.state.set('not-found');
        return;
      }
      this.errorMessage.set(apiError?.message ?? null);
      this.state.set('error');
    }
  }
}
