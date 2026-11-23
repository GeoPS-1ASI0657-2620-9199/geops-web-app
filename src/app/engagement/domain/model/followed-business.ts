import { ActiveOffer } from './active-offer';

export interface FollowedBusiness {
  businessId: number;
  businessName: string;
  followedAt: string;
  activeOffersCount: number;
  activeOffers: ActiveOffer[];
}
