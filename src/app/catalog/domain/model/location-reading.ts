import { GeoPoint } from '../../../shared/domain/geo-point';

/** A reading worse than this cannot place the consumer within a few blocks (E-05). */
export const MAX_ACCURACY_METERS = 1000;

/** What the browser answered when asked for the consumer location (GEO-114). */
export type LocationReading =
  | { readonly status: 'GRANTED'; readonly point: GeoPoint; readonly accuracyMeters: number }
  | { readonly status: 'DENIED' }
  | { readonly status: 'UNAVAILABLE' }
  | { readonly status: 'INSECURE_CONTEXT' };

export function isPrecise(reading: LocationReading): boolean {
  return reading.status === 'GRANTED' && reading.accuracyMeters <= MAX_ACCURACY_METERS;
}
