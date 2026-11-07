import { FollowedBusiness } from '../model/followed-business';

export abstract class FollowRepository {
  abstract findMine(): Promise<FollowedBusiness[]>;
  abstract follow(businessId: number): Promise<FollowedBusiness>;
  abstract unfollow(businessId: number): Promise<void>;
}
