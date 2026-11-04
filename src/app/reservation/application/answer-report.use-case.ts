import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import {
  NonComplianceReport,
  REPORT_ANSWER_MAX,
  REPORT_ANSWER_MIN,
  hasValidLength,
} from '../domain/model/noncompliance-report';
import { ReportRepository } from '../domain/ports/report.repository';

const INVALID_ANSWER_MESSAGE = `Escribe tu respuesta en ${REPORT_ANSWER_MIN} a ${REPORT_ANSWER_MAX} caracteres.`;

/** The business answers a report before its deadline (US43). */
@Injectable({ providedIn: 'root' })
export class AnswerReportUseCase {
  private readonly reports = inject(ReportRepository);

  execute(reportId: number, text: string): Promise<NonComplianceReport> {
    if (!hasValidLength(text, REPORT_ANSWER_MIN, REPORT_ANSWER_MAX)) {
      return Promise.reject(new ApiError('INVALID_REQUEST', INVALID_ANSWER_MESSAGE));
    }
    return this.reports.answer(reportId, text.trim());
  }
}
