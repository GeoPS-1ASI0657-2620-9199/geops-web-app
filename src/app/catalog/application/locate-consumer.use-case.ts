import { Injectable, inject } from '@angular/core';
import { LocationReading, isPrecise } from '../domain/model/location-reading';
import { LocationProvider } from '../domain/ports/location.provider';

type GrantedReading = Extract<LocationReading, { status: 'GRANTED' }>;
export type PickDistrictReason = 'DENIED' | 'UNAVAILABLE' | 'INSECURE_CONTEXT' | 'IMPRECISE';

/** Where the search starts: the reading if it is precise, otherwise the reason to pick a district. */
export type SearchStart =
  | { readonly kind: 'POINT'; readonly reading: GrantedReading }
  | { readonly kind: 'PICK_DISTRICT'; readonly reason: PickDistrictReason; readonly accuracyMeters?: number };

/** Asks the device for the location and decides if it is good enough to search from (US03, US46). */
@Injectable({ providedIn: 'root' })
export class LocateConsumerUseCase {
  private readonly location = inject(LocationProvider);

  async execute(): Promise<SearchStart> {
    const reading = await this.location.locate();
    if (reading.status !== 'GRANTED') {
      return { kind: 'PICK_DISTRICT', reason: reading.status };
    }
    return isPrecise(reading)
      ? { kind: 'POINT', reading }
      : { kind: 'PICK_DISTRICT', reason: 'IMPRECISE', accuracyMeters: Math.round(reading.accuracyMeters) };
  }
}
