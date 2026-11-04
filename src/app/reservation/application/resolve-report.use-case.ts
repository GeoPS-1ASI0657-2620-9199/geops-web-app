import { Injectable, inject } from '@angular/core';
import { NonComplianceReport } from '../domain/model/noncompliance-report';
import { ReportRepository } from '../domain/ports/report.repository';

/** The business closes a report in favor of the consumer; resolving in its own favor is the administrator's. */
@Injectable({ providedIn: 'root' })
export class ResolveReportUseCase {
  private readonly reports = inject(ReportRepository);

  execute(reportId: number): Promise<NonComplianceReport> {
    return this.reports.resolveInFavorOfConsumer(reportId);
  }
}
