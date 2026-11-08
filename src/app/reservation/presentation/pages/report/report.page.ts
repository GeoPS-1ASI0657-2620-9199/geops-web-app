import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GetReservationUseCase } from '../../../application/get-reservation.use-case';
import { OpenReportUseCase } from '../../../application/open-report.use-case';
import { REPORT_REASON_MAX, REPORT_REASON_MIN, hasValidLength } from '../../../domain/model/noncompliance-report';
import { Reservation } from '../../../domain/model/reservation';

/** The reasons of the Figma screen 5. The service stores one text, so the chosen reason leads it. */
export const REPORT_CHOICES = ['expired', 'regularPrice', 'closed', 'other'] as const;
export type ReportChoice = (typeof REPORT_CHOICES)[number];

type ViewState = 'loading' | 'ready' | 'unavailable' | 'error';

/** "¿Qué pasó en el local?": the consumer reports that the business did not honor an active reservation (US42, Figma screen 5). */
@Component({
  selector: 'app-report-page',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, TranslateModule, GeoAlert, GeoEmptyState],
  templateUrl: './report.page.html',
  styleUrl: './report.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly getReservation = inject(GetReservationUseCase);
  private readonly openReport = inject(OpenReportUseCase);
  private readonly translate = inject(TranslateService);

  protected readonly choices = REPORT_CHOICES;
  protected readonly detailMax = REPORT_REASON_MAX - 60;
  protected readonly state = signal<ViewState>('loading');
  protected readonly reservation = signal<Reservation | null>(null);
  protected readonly choice = signal<ReportChoice>('expired');
  protected readonly detail = signal('');
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly reservationId = Number(this.route.snapshot.paramMap.get('id'));

  /** "Otra razón" has no text of its own to say what happened, so the detail is required. */
  protected readonly valid = computed(() => {
    const detail = this.detail().trim();
    return this.choice() === 'other' ? hasValidLength(detail, REPORT_REASON_MIN, this.detailMax) : detail.length <= this.detailMax;
  });

  ngOnInit(): void {
    void this.load();
  }

  protected choose(value: ReportChoice): void {
    this.choice.set(value);
  }

  /** The reason sent: the label of the choice and, when there is one, what the consumer adds. */
  protected reasonText(): string {
    const label = this.translate.instant(`reportPage.reasons.${this.choice()}.title`) as string;
    const detail = this.detail().trim();
    return detail ? `${label}. ${detail}` : label;
  }

  protected async submit(): Promise<void> {
    if (!this.valid() || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.errorMessage.set(null);
    try {
      await this.openReport.execute(this.reservationId, this.reasonText());
      await this.router.navigate(['/reservations', this.reservationId]);
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : '');
    } finally {
      this.sending.set(false);
    }
  }

  private async load(): Promise<void> {
    try {
      const reservation = await this.getReservation.execute(this.reservationId);
      this.reservation.set(reservation);
      this.state.set(reservation.status === 'ACTIVE' && !reservation.report ? 'ready' : 'unavailable');
    } catch (error) {
      this.state.set(error instanceof ApiError && error.code === 'RESERVATION_NOT_FOUND' ? 'unavailable' : 'error');
    }
  }
}
