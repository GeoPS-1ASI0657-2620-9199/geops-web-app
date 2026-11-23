import { Injectable } from '@angular/core';
import { isValidGeoPoint } from '../../shared/domain/geo-point';
import { LimaDistrict } from '../domain/model/lima-district';
import { DistrictPreferenceStore } from '../domain/ports/district-preference.store';

export const DISTRICT_KEY = 'geops.searchDistrict';

/**
 * District in sessionStorage: it lasts while the tab is open, as the place of a search does, and a
 * new visit asks the device again. Blocked storage throws on access; then nothing is kept.
 */
@Injectable()
export class BrowserDistrictPreferenceStore implements DistrictPreferenceStore {
  read(): LimaDistrict | null {
    try {
      const saved = JSON.parse(sessionStorage.getItem(DISTRICT_KEY) ?? 'null') as Partial<LimaDistrict> | null;
      return saved && typeof saved.name === 'string' && saved.name && isValidGeoPoint(saved.center)
        ? { name: saved.name, center: { latitude: saved.center.latitude, longitude: saved.center.longitude } }
        : null;
    } catch {
      return null;
    }
  }

  write(district: LimaDistrict | null): void {
    try {
      if (district) {
        sessionStorage.setItem(DISTRICT_KEY, JSON.stringify({ name: district.name, center: district.center }));
      } else {
        sessionStorage.removeItem(DISTRICT_KEY);
      }
    } catch {
      // Without storage the district lasts until the page reloads.
    }
  }
}
