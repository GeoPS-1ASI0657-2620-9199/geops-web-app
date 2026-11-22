import { Injectable, inject } from '@angular/core';
import { PublishedCampaign } from '../domain/model/campaign';
import { GeoPoint } from '../../shared/domain/geo-point';
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

  /**
   * Where the store was marked last time: the center of the newest radius campaign, which is the
   * point of the store. Null without one, so a new campaign does not ask for the map twice in vain.
   */
  async lastStorePoint(): Promise<GeoPoint | null> {
    const radius = (await this.campaigns.findMine())
      .filter((campaign) => campaign.zone.type === 'RADIUS')
      .sort((a, b) => b.campaignId - a.campaignId);
    return radius[0]?.zone.center ?? null;
  }
}
