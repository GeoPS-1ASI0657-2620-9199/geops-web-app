import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { ReserveOfferUseCase } from '../../../../reservation/application/reserve-offer.use-case';
import { PLACED_PARAM } from '../../../../reservation/presentation/reservation-view';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoOfferCard } from '../../../../shared/ui/geo-offer-card/geo-offer-card';
import { GeoOffersMap, MapPin } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { SaveOfferUseCase } from '../../../../engagement/application/saved-offers.use-cases';
import { GetOfferDetailUseCase } from '../../../application/get-offer-detail.use-case';
import { OfferSearchStore } from '../../../application/offer-search.store';
import { OfferCardActions } from '../../components/offer-card-actions/offer-card-actions';
import { OfferDetail } from '../../../domain/model/offer-detail';
import { validityLabel } from '../../validity-label';

const OFFER_NOT_FOUND = 'OFFER_NOT_FOUND';
const UNAUTHORIZED = 'UNAUTHORIZED';
/** Answers of reservation-service with their own text in offerDetailPage.reserveError.<CODE>. */
const KNOWN_RESERVE_ERRORS = ['OFFER_NOT_AVAILABLE', OFFER_NOT_FOUND, 'CATALOG_UNAVAILABLE'];
const DEFAULT_RESERVE_ERROR = 'DEFAULT';
type ViewState = 'loading' | 'ready' | 'not-found' | 'error';

/** Why the reservation failed: a translation key, or the message of the service when it is unknown. */
interface ReserveFailure {
  readonly code: string;
  readonly message: string | null;
}

/**
 * Offer detail with its loading, not found, error and not available states (US04, GEO-98), and
 * the reservation paid at the business (US40, GEO-196).
 */
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
    GeoOfferCard,
    GeoOffersMap,
    GeoSeal,
    OfferCardActions,
  ],
  templateUrl: './offer-detail.page.html',
  styleUrl: './offer-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OfferDetailPage implements OnInit {
  private readonly getOfferDetail = inject(GetOfferDetailUseCase);
  private readonly reserveOffer = inject(ReserveOfferUseCase);
  private readonly sessions = inject(SessionStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly saveOffer = inject(SaveOfferUseCase);
  private readonly search = inject(OfferSearchStore);
  private offerId = Number(this.route.snapshot.paramMap.get('id'));

  protected readonly state = signal<ViewState>('loading');
  protected readonly offer = signal<OfferDetail | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly reserving = signal(false);
  protected readonly reserveFailure = signal<ReserveFailure | null>(null);
  /** Visitors see it and log in first; business owners and admins cannot reserve. */
  protected readonly canReserve = computed(() => {
    const role = this.sessions.role();
    return role === null || role === 'CONSUMER';
  });
  protected readonly isVisitor = computed(() => this.sessions.role() === null);
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

  protected readonly saving = signal(false);
  /** i18n key of the answer to "Guardar en favoritos". */
  protected readonly saveResult = signal<string | null>(null);
  protected readonly icon = computed(() => categoryIcon(this.offer()?.category));
  /** Each sentence of the conditions is one item of "Qué incluye" (Figma screen 2). */
  protected readonly includes = computed(() =>
    (this.offer()?.conditions ?? '')
      .split(/(?<=\.)\s+|\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );
  /** Distance and minutes as the nearby search measured them, when the consumer came from it. */
  protected readonly distance = computed(() => {
    const found = this.search.offers().find((o) => o.offerId === this.offer()?.offerId);
    return found ? { meters: found.distanceMeters, minutes: found.walkMinutes } : null;
  });
  protected readonly consumerPoint = computed(() => this.search.origin()?.point ?? null);
  protected readonly pin = computed<MapPin[]>(() => {
    const offer = this.offer();
    return offer
      ? [{ id: offer.offerId, point: offer.location, icon: categoryIcon(offer.category), label: offer.businessName, kind: offer.source === 'PUBLIC_SOURCE' ? 'reference' : 'verified' }]
      : [];
  });
  /** "Otras ofertas cerca de ti": the next four of the current search. */
  protected readonly others = computed(() =>
    this.search.offers().filter((o) => o.offerId !== this.offer()?.offerId).slice(0, 4),
  );

  ngOnInit(): void {
    // The same page shows another offer when the consumer opens one of "Otras ofertas cerca de ti".
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.offerId = Number(params.get('id'));
      this.saveResult.set(null);
      this.reserveFailure.set(null);
      void this.load();
    });
  }

  protected validityOf(validTo: string): string {
    return validityLabel(validTo);
  }

  async save(): Promise<void> {
    if (!this.sessions.activeSession()) {
      await this.goToLogin();
      return;
    }
    this.saving.set(true);
    try {
      await this.saveOffer.execute(this.offerId);
      this.saveResult.set('offerActions.saved');
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      if (apiError?.code === UNAUTHORIZED) {
        await this.goToLogin();
        return;
      }
      this.saveResult.set(
        apiError?.code === OFFER_NOT_FOUND ? 'offerActions.errors.OFFER_NOT_FOUND' : 'offerActions.errors.DEFAULT',
      );
    } finally {
      this.saving.set(false);
    }
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

  async reserve(): Promise<void> {
    if (!this.sessions.activeSession()) {
      await this.goToLogin();
      return;
    }
    this.reserving.set(true);
    this.reserveFailure.set(null);
    try {
      const placed = await this.reserveOffer.execute(this.offerId);
      await this.router.navigate(['/reservations', placed.reservationId], {
        queryParams: { [PLACED_PARAM]: placed.isNew ? 'new' : 'existing' },
      });
    } catch (error) {
      await this.showReserveFailure(error);
    } finally {
      this.reserving.set(false);
    }
  }

  private async showReserveFailure(error: unknown): Promise<void> {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError?.code === UNAUTHORIZED) {
      await this.goToLogin();
      return;
    }
    const isKnown = !!apiError && KNOWN_RESERVE_ERRORS.includes(apiError.code);
    this.reserveFailure.set({
      code: isKnown ? apiError.code : DEFAULT_RESERVE_ERROR,
      message: isKnown ? null : (apiError?.message ?? null),
    });
  }

  private goToLogin(): Promise<boolean> {
    return this.router.navigate(['/login'], { queryParams: { returnUrl: `/offers/${this.offerId}` } });
  }
}
