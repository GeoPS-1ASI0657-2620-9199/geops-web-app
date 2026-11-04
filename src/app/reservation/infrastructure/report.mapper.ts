import { NonComplianceReport, ReportStatus, ReservationReport } from '../domain/model/noncompliance-report';

/** Body of every report answer of reservation-service (ReportResponse). */
export interface ReportResponse {
  reportId: number;
  reservationId: number;
  reservationCode: string;
  offerTitle: string;
  reason: string;
  status: ReportStatus;
  openedAt: string;
  responseDeadline: string;
  response: { text: string; respondedAt: string } | null;
  resolution: 'CONSUMER_FAVOR' | 'BUSINESS_FAVOR' | null;
  resolvedAt: string | null;
}

/** The report inside a reservation (ReservationReportSummary). */
export interface ReservationReportResponse {
  reportId: number;
  status: ReportStatus;
  responseDeadline: string;
}

export function toReport(response: ReportResponse): NonComplianceReport {
  return {
    reportId: response.reportId,
    reservationId: response.reservationId,
    reservationCode: response.reservationCode,
    offerTitle: response.offerTitle,
    reason: response.reason,
    status: response.status,
    openedAt: response.openedAt,
    responseDeadline: response.responseDeadline,
    response: response.response ? { text: response.response.text, respondedAt: response.response.respondedAt } : null,
    resolution: response.resolution ?? null,
    resolvedAt: response.resolvedAt ?? null,
  };
}

export function toReservationReport(response: ReservationReportResponse | null | undefined): ReservationReport | null {
  return response
    ? { reportId: response.reportId, status: response.status, responseDeadline: response.responseDeadline }
    : null;
}
