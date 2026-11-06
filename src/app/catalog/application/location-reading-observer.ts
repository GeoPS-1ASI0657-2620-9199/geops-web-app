import { InjectionToken } from '@angular/core';
import { GrantedReading } from '../domain/model/location-reading';
export const LOCATION_READING_OBSERVER = new InjectionToken<(reading: GrantedReading) => Promise<void>>('LOCATION_READING_OBSERVER', {
  providedIn: 'root', factory: () => async () => {},
});
