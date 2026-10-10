import { SavedOffer } from '../model/saved-offer';

/** Port to the saved offers of engagement-service. The consumer comes from the token; rejects with ApiError. */
export abstract class SavedOfferRepository {
  abstract findMine(): Promise<SavedOffer[]>;
  abstract save(offerId: number): Promise<void>;
  abstract remove(offerId: number): Promise<void>;
}
