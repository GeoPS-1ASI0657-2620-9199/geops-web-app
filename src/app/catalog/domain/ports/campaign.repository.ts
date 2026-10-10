import { CampaignDraft, CreatedCampaign, CampaignOffer, PublishedCampaign } from '../model/campaign';

/** Port to the campaigns of Catalog. The business comes from the token the interceptor adds. */
export abstract class CampaignRepository {
  abstract create(draft: CampaignDraft): Promise<CreatedCampaign>;
  /** The campaigns of the business in the token, without their offers. */
  abstract findMine(): Promise<Omit<PublishedCampaign, 'offers'>[]>;
  abstract findOffers(campaignId: number): Promise<CampaignOffer[]>;
}
