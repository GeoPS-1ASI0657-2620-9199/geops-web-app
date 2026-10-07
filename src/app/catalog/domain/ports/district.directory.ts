import { LimaDistrict } from '../model/lima-district';

/** The districts a consumer can pick when the location is not available or not precise. */
export abstract class DistrictDirectory {
  abstract all(): readonly LimaDistrict[];
}
