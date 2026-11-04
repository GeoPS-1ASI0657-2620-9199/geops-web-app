import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import {
  NonComplianceReport,
  REPORT_REASON_MAX,
  REPORT_REASON_MIN,
  hasValidLength,
} from '../domain/model/noncompliance-report';
import { isPositiveId } from '../domain/model/reservation';
import { ReportRepository } from '../domain/ports/report.repository';

export const INVALID_REPORT_REASON = 'INVALID_REQUEST';
const INVALID_REASON_MESSAGE = `Cuéntanos el motivo en ${REPORT_REASON_MIN} a ${REPORT_REASON_MAX} caracteres.`;

/** The consumer reports that the business did not honor an ACTIVE reservation (US42). */
@Injectable({ providedIn: 'root' })
export class OpenReportUseCase {
  private readonly reports = inject(ReportRepository);

  execute(reservationId: number, reason: string): Promise<NonComplianceReport> {
    if (!hasValidLength(reason, REPORT_REASON_MIN, REPORT_REASON_MAX) || !isPositiveId(reservationId)) {
      return Promise.reject(new ApiError(INVALID_REPORT_REASON, INVALID_REASON_MESSAGE));
    }
    return this.reports.open(reservationId, reason.trim());
  }
}
