import { SavedBusiness } from '../model/saved-business';
export abstract class SavedBusinessRepository {
  abstract findMine(): Promise<SavedBusiness[]>;
  abstract save(businessId: number): Promise<void>;
  abstract remove(businessId: number): Promise<void>;
}
