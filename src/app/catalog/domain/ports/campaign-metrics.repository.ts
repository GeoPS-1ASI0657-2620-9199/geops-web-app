import {
  BusinessBaseline,
  CampaignMetrics,
  CampaignMetricsSummary,
  PeriodRequest,
} from '../model/campaign-metrics';

/** Port to the metrics of the campaigns and the baseline of the business in the token (US11, US45). */
export abstract class CampaignMetricsRepository {
  abstract findMetrics(campaignId: number, period: PeriodRequest): Promise<CampaignMetrics>;
  /** Every campaign of the business with its totals; one without activity comes with zeros. */
  abstract findSummary(period: PeriodRequest): Promise<CampaignMetricsSummary>;
  /** Null when the business has not declared it yet. */
  abstract findBaseline(): Promise<BusinessBaseline | null>;
  abstract declareBaseline(customersPerWeek: number, averageTicket: number): Promise<BusinessBaseline>;
}
