import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { NonComplianceReport, ReportStatus } from '../domain/model/noncompliance-report';
import { ReportRepository } from '../domain/ports/report.repository';
import { ReportResponse, toReport } from './report.mapper';

/** ReportRepository over the gateway route of reservation-service; the interceptor adds the token. */
@Injectable()
export class HttpReportRepository implements ReportRepository {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  open(reservationId: number, reason: string): Promise<NonComplianceReport> {
    return this.send(this.http.post<ReportResponse>(`${this.base}/reservations/${reservationId}/reports`, { reason }));
  }

  async list(status: ReportStatus | null): Promise<NonComplianceReport[]> {
    const params = status ? new HttpParams().set('status', status) : new HttpParams();
    try {
      const response = await firstValueFrom(this.http.get<ReportResponse[]>(`${this.base}/reports`, { params }));
      return response.map(toReport);
    } catch (error) {
      throw toApiError(error);
    }
  }

  get(reportId: number): Promise<NonComplianceReport> {
    return this.send(this.http.get<ReportResponse>(`${this.base}/reports/${reportId}`));
  }

  answer(reportId: number, text: string): Promise<NonComplianceReport> {
    return this.send(this.http.post<ReportResponse>(`${this.base}/reports/${reportId}/responses`, { text }));
  }

  resolveInFavorOfConsumer(reportId: number): Promise<NonComplianceReport> {
    return this.send(
      this.http.patch<ReportResponse>(`${this.base}/reports/${reportId}/status`, {
        status: 'CLOSED',
        resolution: 'CONSUMER_FAVOR',
      }),
    );
  }

  private async send(request: Observable<ReportResponse>): Promise<NonComplianceReport> {
    try {
      return toReport(await firstValueFrom(request));
    } catch (error) {
      throw toApiError(error);
    }
  }
}
