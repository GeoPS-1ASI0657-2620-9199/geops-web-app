import { CampaignDraft, CreatedCampaign } from '../model/campaign';

/** Port to the campaigns of Catalog. The business comes from the token the interceptor adds. */
export abstract class CampaignRepository {
  abstract create(draft: CampaignDraft): Promise<CreatedCampaign>;
}
