import { LimaDistrict } from '../model/lima-district';

/**
 * Port to where this tab keeps the district the visitor picked by hand (US03, CA-03.2), so a reload
 * or a change of tab searches from the same place instead of asking again.
 */
export abstract class DistrictPreferenceStore {
  /** The district picked in this tab, or null when there is none or it is not valid. Never throws. */
  abstract read(): LimaDistrict | null;
  /** null forgets it, when the search goes back to the device location. Never throws. */
  abstract write(district: LimaDistrict | null): void;
}
