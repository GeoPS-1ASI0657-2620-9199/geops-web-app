import { Injectable, inject } from '@angular/core';
import { NonComplianceReport, ReportStatus } from '../domain/model/noncompliance-report';
import { ReportRepository } from '../domain/ports/report.repository';

/** The reports of the business in the session (US43), newest first, optionally of one status. */
@Injectable({ providedIn: 'root' })
export class ListReportsUseCase {
  private readonly reports = inject(ReportRepository);

  execute(status: ReportStatus | null = null): Promise<NonComplianceReport[]> {
    return this.reports.list(status);
  }
}
