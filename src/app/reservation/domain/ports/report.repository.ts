import { NonComplianceReport, ReportStatus } from '../model/noncompliance-report';

/**
 * Port to the reports of reservation-service. The consumer or the business owner comes from the token
 * the interceptor adds. Implementations reject with ApiError.
 */
export abstract class ReportRepository {
  /** The consumer reports an ACTIVE reservation of theirs. */
  abstract open(reservationId: number, reason: string): Promise<NonComplianceReport>;
  /** Newest first, only the reports of the caller; null brings every status. */
  abstract list(status: ReportStatus | null): Promise<NonComplianceReport[]>;
  abstract get(reportId: number): Promise<NonComplianceReport>;
  /** The business answers once, before the deadline. */
  abstract answer(reportId: number, text: string): Promise<NonComplianceReport>;
  /** The business closes the report in favor of the consumer. */
  abstract resolveInFavorOfConsumer(reportId: number): Promise<NonComplianceReport>;
}
