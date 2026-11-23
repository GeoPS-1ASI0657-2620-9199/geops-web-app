import { ActiveOffer } from './active-offer';

/** A business the consumer saved, with every offer it has open today (US12). */
export interface SavedBusiness {
  id: number;
  businessId: number;
  businessName: string;
  savedAt: string;
  activeOffersCount: number;
  activeOffers: ActiveOffer[];
}
