import { Injectable } from '@angular/core';
import { isValidRadius } from '../domain/model/nearby-offer';
import { RadiusPreferenceStore } from '../domain/ports/radius-preference.store';

export const RADIUS_KEY = 'geops.searchRadius';

/**
 * Radius in localStorage, so it survives closing the browser. A private window or blocked storage
 * throws on access; then nothing is kept and the search uses the default radius.
 */
@Injectable()
export class BrowserRadiusPreferenceStore implements RadiusPreferenceStore {
  read(): number | null {
    try {
      const minutes = Number(localStorage.getItem(RADIUS_KEY));
      return isValidRadius(minutes) ? minutes : null;
    } catch {
      return null;
    }
  }

  write(minutes: number): void {
    try {
      localStorage.setItem(RADIUS_KEY, String(minutes));
    } catch {
      // Without storage the choice lasts until the tab closes.
    }
  }
}
