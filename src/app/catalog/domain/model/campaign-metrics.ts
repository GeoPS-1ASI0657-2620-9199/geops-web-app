import { CampaignStatus } from './campaign';

/** The four counters of a campaign (US11), as GET /campaigns/{id}/metrics returns them. */
export interface MetricTotals {
  impressions: number;
  clicks: number;
  reservations: number;
  redemptions: number;
}

/** Percentages with one decimal; null when the base is 0 (no impressions, no clicks...). */
export interface MetricRates {
  clickThroughRate: number | null;
  reservationRate: number | null;
  redemptionRate: number | null;
  conversionRate: number | null;
}

export interface DailyMetric extends MetricTotals {
  /** Day of Lima, yyyy-MM-dd. */
  date: string;
}

export interface MetricsPeriod {
  from: string;
  to: string;
  days: number;
}

/** The usual numbers of the business before GeoPS (US45). */
export interface BusinessBaseline {
  customersPerWeek: number;
  averageTicket: number;
  declaredAt: string;
}

/** The campaign against the baseline in the same number of days. */
export interface BaselineComparison extends BusinessBaseline {
  expectedCustomers: number;
  campaignCustomers: number;
  customersChangePercent: number | null;
  estimatedExtraSales: number;
}

export interface CampaignMetrics {
  campaignId: number;
  campaignName: string;
  status: CampaignStatus;
  period: MetricsPeriod;
  totals: MetricTotals;
  rates: MetricRates;
  /** Every day of the period, zeros included. */
  daily: DailyMetric[];
  baseline: BaselineComparison | null;
}

export interface CampaignTotalsRow {
  campaignId: number;
  name: string;
  status: CampaignStatus;
  totals: MetricTotals;
  rates: MetricRates;
}

export interface CampaignMetricsSummary {
  period: MetricsPeriod;
  campaigns: CampaignTotalsRow[];
}

/** The range asked for; both ends absent means the validity of the campaign up to today. */
export interface PeriodRequest {
  from?: string;
  to?: string;
}

export type PeriodPreset = 'campaign' | 'last7' | 'last30' | 'custom';

export type MetricSeries = keyof MetricTotals;

export const MAX_PERIOD_DAYS = 366;
export const MAX_CUSTOMERS_PER_WEEK = 100_000;
export const MAX_AVERAGE_TICKET = 99_999.99;

/** The dates of a preset counted back from today in Lima (yyyy-MM-dd); the campaign preset sends none. */
export function periodFor(preset: Exclude<PeriodPreset, 'custom'>, today: string): PeriodRequest {
  if (preset === 'campaign') {
    return {};
  }
  return { from: addDays(today, preset === 'last7' ? -6 : -29), to: today };
}

/** Why a custom range cannot be asked for, or null when it can. */
export function customPeriodError(from: string, to: string): 'missing' | 'order' | 'tooLong' | null {
  if (!from || !to) {
    return 'missing';
  }
  if (to < from) {
    return 'order';
  }
  return daysBetween(from, to) + 1 > MAX_PERIOD_DAYS ? 'tooLong' : null;
}

/** Why a baseline cannot be declared, or null when it can. Same rules as catalog-service. */
export function baselineError(customersPerWeek: number | null, averageTicket: number | null): 'customers' | 'ticket' | null {
  if (customersPerWeek === null || !Number.isInteger(customersPerWeek) || customersPerWeek < 1 || customersPerWeek > MAX_CUSTOMERS_PER_WEEK) {
    return 'customers';
  }
  if (averageTicket === null || !(averageTicket > 0) || averageTicket > MAX_AVERAGE_TICKET || Math.abs(Math.round(averageTicket * 100) - averageTicket * 100) > 1e-6) {
    return 'ticket';
  }
  return null;
}

/** Height of each bar as a share of the highest day, so the busiest day fills the chart. */
export function barShares(daily: readonly DailyMetric[], series: MetricSeries): number[] {
  const max = Math.max(0, ...daily.map((day) => day[series]));
  return daily.map((day) => (max === 0 ? 0 : day[series] / max));
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86_400_000);
}
