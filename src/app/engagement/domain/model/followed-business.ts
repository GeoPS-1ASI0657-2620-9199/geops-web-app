export interface FollowedBusiness {
  businessId: number;
  businessName: string;
  followedAt: string;
  activeOffersCount: number;
  activeOffers: { offerId: number; title: string; validTo: string }[];
}
