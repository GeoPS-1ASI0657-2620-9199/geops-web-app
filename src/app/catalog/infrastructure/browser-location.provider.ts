import { Injectable } from '@angular/core';
import { LocationReading } from '../domain/model/location-reading';
import { LocationProvider } from '../domain/ports/location.provider';

/** High accuracy, at most 10 s waiting and a reading of up to one minute old (GEO-114). */
export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 60_000,
};
const PERMISSION_DENIED = 1;

/** LocationProvider over the browser Geolocation API. It only works on HTTPS or localhost. */
@Injectable()
export class BrowserLocationProvider implements LocationProvider {
  locate(): Promise<LocationReading> {
    if (!window.isSecureContext) {
      return Promise.resolve({ status: 'INSECURE_CONTEXT' });
    }
    if (!('geolocation' in navigator)) {
      return Promise.resolve({ status: 'UNAVAILABLE' });
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            status: 'GRANTED',
            point: { latitude: position.coords.latitude, longitude: position.coords.longitude },
            accuracyMeters: position.coords.accuracy,
          }),
        (error) => resolve({ status: error.code === PERMISSION_DENIED ? 'DENIED' : 'UNAVAILABLE' }),
        GEOLOCATION_OPTIONS,
      );
    });
  }
}
