/** Same values as ReportStatus of reservation-service. */
export const REPORT_STATUSES = ['OPEN', 'IN_REVIEW', 'CLOSED'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

/** The reason the consumer writes: 10 to 500 characters, as in ReportReason of reservation-service. */
export const REPORT_REASON_MIN = 10;
export const REPORT_REASON_MAX = 500;
/** The answer of the business: 10 to 2000 characters. */
export const REPORT_ANSWER_MIN = 10;
export const REPORT_ANSWER_MAX = 2000;

export interface ReportAnswer {
  readonly text: string;
  readonly respondedAt: string;
}

/** A consumer's report that the business did not honor an offer (US42) and what the business replied (US43). */
export interface NonComplianceReport {
  readonly reportId: number;
  readonly reservationId: number;
  readonly reservationCode: string;
  readonly offerTitle: string;
  readonly reason: string;
  readonly status: ReportStatus;
  readonly openedAt: string;
  /** Until when the business can answer; after it the report closes in favor of the consumer. */
  readonly responseDeadline: string;
  readonly response: ReportAnswer | null;
  readonly resolution: 'CONSUMER_FAVOR' | 'BUSINESS_FAVOR' | null;
  readonly resolvedAt: string | null;
}

/** What a reservation shows of its report: that it exists, how it stands and the response deadline. */
export interface ReservationReport {
  readonly reportId: number;
  readonly status: ReportStatus;
  readonly responseDeadline: string;
}

export function isReportStatus(value: string | null | undefined): value is ReportStatus {
  return REPORT_STATUSES.includes(value as ReportStatus);
}

export function hasValidLength(text: string, min: number, max: number): boolean {
  const length = text.trim().length;
  return length >= min && length <= max;
}
