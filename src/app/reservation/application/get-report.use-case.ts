import { Injectable, inject } from '@angular/core';
import { NonComplianceReport } from '../domain/model/noncompliance-report';
import { ReportRepository } from '../domain/ports/report.repository';

/** One report, to show the consumer what the business answered (US43). */
@Injectable({ providedIn: 'root' })
export class GetReportUseCase {
  private readonly reports = inject(ReportRepository);

  execute(reportId: number): Promise<NonComplianceReport> {
    return this.reports.get(reportId);
  }
}
