import { LocationReading } from '../model/location-reading';

/** Port to the device location. It never rejects: every outcome is a LocationReading. */
export abstract class LocationProvider {
  abstract locate(): Promise<LocationReading>;
}
