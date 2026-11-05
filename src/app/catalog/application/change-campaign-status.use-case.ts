import { Injectable, inject } from '@angular/core';
import { PublishedCampaign, RequestableCampaignStatus } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';

/**
 * Pauses or reactivates a campaign of the owner (US10). Catalog answers the campaign without its
 * offers, so the ones already on screen are kept.
 */
@Injectable({ providedIn: 'root' })
export class ChangeCampaignStatusUseCase {
  private readonly campaigns = inject(CampaignRepository);

  async execute(campaign: PublishedCampaign, status: RequestableCampaignStatus): Promise<PublishedCampaign> {
    const changed = await this.campaigns.changeStatus(campaign.campaignId, status);
    return { ...changed, offers: campaign.offers };
  }
}
