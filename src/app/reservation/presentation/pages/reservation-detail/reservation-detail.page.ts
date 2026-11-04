import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { DecimalPipe } from '@angular/common';
import { GetOfferDetailUseCase } from '../../../../catalog/application/get-offer-detail.use-case';
import { OfferDetail } from '../../../../catalog/domain/model/offer-detail';
import { ApiError } from '../../../../shared/domain/api-error';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoOffersMap, MapPin } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { GetReportUseCase } from '../../../application/get-report.use-case';
import { GetReservationUseCase, RESERVATION_NOT_FOUND } from '../../../application/get-reservation.use-case';
import { NonComplianceReport } from '../../../domain/model/noncompliance-report';
import { ReportForm } from '../../components/report-form/report-form';
import { Reservation } from '../../../domain/model/reservation';
import { PLACED_PARAM, STATUS_SEAL, limaDateTime, remainingTime } from '../../reservation-view';

/** The reservation is missing or belongs to another account: either way there is nothing to retry. */
const NOT_FOUND_CODES = [RESERVATION_NOT_FOUND, 'FORBIDDEN'];

type ViewState = 'loading' | 'ready' | 'not-found' | 'error';
type Placed = 'new' | 'existing' | null;

/** "Mi reserva": the code to show at the business and how to pay there (US40, Figma screen 4). */
@Component({
  selector: 'app-reservation-detail',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState, GeoOffersMap, GeoSeal, ReportForm],
  templateUrl: './reservation-detail.page.html',
  styleUrl: './reservation-detail.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReservationDetailPage implements OnInit {
  private readonly getReservation = inject(GetReservationUseCase);
  private readonly getOffer = inject(GetOfferDetailUseCase);
  private readonly getReport = inject(GetReportUseCase);
  private readonly route = inject(ActivatedRoute).snapshot;
  private readonly reservationId = Number(this.route.paramMap.get('id'));

  protected readonly placed = this.route.queryParamMap.get(PLACED_PARAM) as Placed;
  protected readonly state = signal<ViewState>('loading');
  protected readonly reservation = signal<Reservation | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly seal = computed(() => STATUS_SEAL[this.reservation()?.status ?? 'ACTIVE']);
  protected readonly isActive = computed(() => this.reservation()?.status === 'ACTIVE');
  /** The report of this reservation and what the business answered, once there is one (US42, US43). */
  protected readonly report = signal<NonComplianceReport | null>(null);
  protected readonly reporting = signal(false);
  /** An ACTIVE reservation that has not reached its deadline can still be reported. */
  protected readonly canReport = computed(() => this.isActive() && this.remaining() !== null && !this.report());
  protected readonly limaDateTime = limaDateTime;
  /** The reserved offer, for the price, the address and the map; the reservation still shows without it. */
  protected readonly offer = signal<OfferDetail | null>(null);
  protected readonly remaining = computed(() => {
    const reservation = this.reservation();
    return reservation?.status === 'ACTIVE' ? remainingTime(reservation.expiresAt, Date.now()) : null;
  });
  protected readonly pins = computed<MapPin[]>(() => {
    const offer = this.offer();
    return offer
      ? [{ id: offer.offerId, point: offer.location, icon: categoryIcon(offer.category), label: offer.businessName, kind: 'verified' }]
      : [];
  });
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
    this.state.set('loading');
    try {
      const reservation = await this.getReservation.execute(this.reservationId);
      this.reservation.set(reservation);
      this.state.set('ready');
      void this.loadOffer(reservation.offerId);
      void this.loadReport(reservation.report?.reportId);
    } catch (error) {
      this.showFailure(error);
    }
  }

  protected onReported(report: NonComplianceReport): void {
    this.report.set(report);
    this.reporting.set(false);
    void this.load();
  }

  /** The reservation lists the report in short; the detail brings the answer of the business. */
  private async loadReport(reportId: number | undefined): Promise<void> {
    if (reportId === undefined) {
      this.report.set(null);
      return;
    }
    try {
      this.report.set(await this.getReport.execute(reportId));
    } catch {
      this.report.set(null);
    }
  }

  private async loadOffer(offerId: number): Promise<void> {
    try {
      this.offer.set(await this.getOffer.execute(offerId));
    } catch {
      this.offer.set(null);
    }
  }

  private showFailure(error: unknown): void {
    const apiError = error instanceof ApiError ? error : null;
    if (apiError && NOT_FOUND_CODES.includes(apiError.code)) {
      this.state.set('not-found');
      return;
    }
    this.errorMessage.set(apiError?.message ?? null);
    this.state.set('error');
  }
}
