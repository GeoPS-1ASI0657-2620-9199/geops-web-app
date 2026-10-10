import { Injectable, inject } from '@angular/core';
import { PublishedCampaign } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';

/** The owner's campaigns with their offers, newest first (US10, Figma screens 11 and 12). */
@Injectable({ providedIn: 'root' })
export class ListMyCampaignsUseCase {
  private readonly campaigns = inject(CampaignRepository);

  async execute(): Promise<PublishedCampaign[]> {
    const mine = await this.campaigns.findMine();
    const withOffers = await Promise.all(
      mine.map(async (campaign) => ({ ...campaign, offers: await this.campaigns.findOffers(campaign.campaignId) })),
    );
    return withOffers.sort((a, b) => b.campaignId - a.campaignId);
  }
}
