import { Injectable, inject } from '@angular/core';
import { CampaignMetrics, CampaignTotalsRow, PeriodRequest } from '../domain/model/campaign-metrics';
import { CampaignMetricsRepository } from '../domain/ports/campaign-metrics.repository';

export interface CampaignMetricsView {
  metrics: CampaignMetrics;
  /** Every campaign of the business in the same days, to compare this one with the rest. */
  others: CampaignTotalsRow[];
}

/** The metrics of one campaign and, for the same days, the totals of every campaign of the owner (US11). */
@Injectable({ providedIn: 'root' })
export class GetCampaignMetricsUseCase {
  private readonly repository = inject(CampaignMetricsRepository);

  async execute(campaignId: number, period: PeriodRequest): Promise<CampaignMetricsView> {
    const metrics = await this.repository.findMetrics(campaignId, period);
    const summary = await this.repository.findSummary({ from: metrics.period.from, to: metrics.period.to });
    return { metrics, others: summary.campaigns };
  }
}
