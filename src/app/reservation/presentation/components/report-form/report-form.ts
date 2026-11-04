import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { OpenReportUseCase } from '../../../application/open-report.use-case';
import {
  NonComplianceReport,
  REPORT_REASON_MAX,
  REPORT_REASON_MIN,
  hasValidLength,
} from '../../../domain/model/noncompliance-report';

/** The consumer writes why the business did not honor the offer (US42); the API rejects what the form lets through. */
@Component({
  selector: 'app-report-form',
  standalone: true,
  imports: [FormsModule, MatButtonModule, TranslateModule, GeoAlert],
  templateUrl: './report-form.html',
  styleUrl: './report-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportForm {
  private readonly openReport = inject(OpenReportUseCase);

  readonly reservationId = input.required<number>();
  readonly reported = output<NonComplianceReport>();
  readonly cancelled = output<void>();

  protected readonly min = REPORT_REASON_MIN;
  protected readonly max = REPORT_REASON_MAX;
  protected readonly reason = signal('');
  protected readonly sending = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly length = computed(() => this.reason().trim().length);
  protected readonly valid = computed(() => hasValidLength(this.reason(), this.min, this.max));

  async submit(): Promise<void> {
    if (!this.valid() || this.sending()) {
      return;
    }
    this.sending.set(true);
    this.errorMessage.set(null);
    try {
      this.reported.emit(await this.openReport.execute(this.reservationId(), this.reason()));
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : '');
    } finally {
      this.sending.set(false);
    }
  }
}
