import { Provider } from '@angular/core';
import { RadiusPreferenceGateway } from '../domain/ports/radius-preference.gateway';
import { RadiusPreferenceStore } from '../domain/ports/radius-preference.store';

/** Test double of the browser storage of the radius. */
export class MemoryRadiusPreferenceStore extends RadiusPreferenceStore {
  constructor(public saved: number | null = null) {
    super();
  }
  override read(): number | null {
    return this.saved;
  }
  override write(minutes: number): void {
    this.saved = minutes;
  }
}

/** Radius ports for specs that do not look at them: nothing saved, profile at the default. */
export function radiusPreferenceTestingProviders(saved: number | null = null): Provider[] {
  return [
    { provide: RadiusPreferenceStore, useValue: new MemoryRadiusPreferenceStore(saved) },
    { provide: RadiusPreferenceGateway, useValue: { fetch: () => Promise.resolve(10), save: () => Promise.resolve() } },
  ];
}
