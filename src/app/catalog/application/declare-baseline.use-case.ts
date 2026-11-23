import { Injectable, inject } from '@angular/core';
import { BusinessBaseline, baselineError } from '../domain/model/campaign-metrics';
import { CampaignMetricsRepository } from '../domain/ports/campaign-metrics.repository';

export class InvalidBaselineError extends Error {
  constructor(readonly reason: 'customers' | 'ticket') {
    super(reason);
    this.name = 'InvalidBaselineError';
  }
}

/** Declares or replaces the customers per week and average ticket of the business (US45). */
@Injectable({ providedIn: 'root' })
export class DeclareBaselineUseCase {
  private readonly repository = inject(CampaignMetricsRepository);

  async execute(customersPerWeek: number | null, averageTicket: number | null): Promise<BusinessBaseline> {
    const reason = baselineError(customersPerWeek, averageTicket);
    if (reason) {
      throw new InvalidBaselineError(reason);
    }
    return this.repository.declareBaseline(customersPerWeek!, averageTicket!);
  }
}
