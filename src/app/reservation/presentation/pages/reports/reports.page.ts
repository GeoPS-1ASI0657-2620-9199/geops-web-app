import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { AnswerReportUseCase } from '../../../application/answer-report.use-case';
import { ListReportsUseCase } from '../../../application/list-reports.use-case';
import { ResolveReportUseCase } from '../../../application/resolve-report.use-case';
import {
  NonComplianceReport,
  REPORT_ANSWER_MAX,
  REPORT_ANSWER_MIN,
  ReportStatus,
  hasValidLength,
} from '../../../domain/model/noncompliance-report';
import { limaDateTime } from '../../reservation-view';

type ViewState = 'loading' | 'ready' | 'error';

const TABS: readonly ReportStatus[] = ['OPEN', 'IN_REVIEW', 'CLOSED'];
const MILLIS_PER_MINUTE = 60_000;
const MINUTES_PER_HOUR = 60;

/** "31 h", "45 min" or null once the deadline passed: what the business still has to answer. */
export function timeToAnswer(deadline: string, now: number): string | null {
  const minutes = Math.floor((new Date(deadline).getTime() - now) / MILLIS_PER_MINUTE);
  if (minutes <= 0) {
    return null;
  }
  return minutes >= MINUTES_PER_HOUR ? `${Math.floor(minutes / MINUTES_PER_HOUR)} h` : `${minutes} min`;
}

/** The business sees the reports of its customers, answers within the deadline and closes them (US43). */
@Component({
  selector: 'app-reports-page',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState],
  templateUrl: './reports.page.html',
  styleUrl: './reports.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage implements OnInit {
  private readonly listReports = inject(ListReportsUseCase);
  private readonly answerReport = inject(AnswerReportUseCase);
  private readonly resolveReport = inject(ResolveReportUseCase);

  protected readonly tabs = TABS;
  protected readonly min = REPORT_ANSWER_MIN;
  protected readonly max = REPORT_ANSWER_MAX;
  protected readonly limaDateTime = limaDateTime;
  protected readonly timeToAnswer = timeToAnswer;
  protected readonly now = (): number => Date.now();
  protected readonly state = signal<ViewState>('loading');
  protected readonly tab = signal<ReportStatus>('OPEN');
  protected readonly reports = signal<NonComplianceReport[]>([]);
  protected readonly visible = computed(() => this.reports().filter((report) => report.status === this.tab()));
  protected readonly drafts = signal<Record<number, string>>({});
  protected readonly confirming = signal<number | null>(null);
  protected readonly working = signal<number | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionError = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  count(status: ReportStatus): number {
    return this.reports().filter((report) => report.status === status).length;
  }

  draft(reportId: number): string {
    return this.drafts()[reportId] ?? '';
  }

  setDraft(reportId: number, text: string): void {
    this.drafts.update((drafts) => ({ ...drafts, [reportId]: text }));
  }

  canSend(reportId: number): boolean {
    return hasValidLength(this.draft(reportId), this.min, this.max) && this.working() === null;
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.reports.set(await this.listReports.execute(null));
      this.state.set('ready');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.state.set('error');
    }
  }

  async answer(report: NonComplianceReport): Promise<void> {
    await this.act(report, () => this.answerReport.execute(report.reportId, this.draft(report.reportId)));
  }

  async resolve(report: NonComplianceReport): Promise<void> {
    await this.act(report, () => this.resolveReport.execute(report.reportId));
    this.confirming.set(null);
  }

  private async act(report: NonComplianceReport, action: () => Promise<NonComplianceReport>): Promise<void> {
    this.working.set(report.reportId);
    this.actionError.set(null);
    try {
      const updated = await action();
      this.reports.update((all) => all.map((item) => (item.reportId === updated.reportId ? updated : item)));
    } catch (error) {
      this.actionError.set(error instanceof ApiError ? error.message : '');
    } finally {
      this.working.set(null);
    }
  }
}
