import { GeoPoint } from '../domain/geo-point';

const GOOGLE_MAPS_DIRECTIONS = 'https://www.google.com/maps/dir/';

/**
 * Walking directions on Google Maps to the offer. It needs no API key. Without a starting point Google Maps
 * starts from the current location of the phone.
 */
export function walkingDirectionsUrl(destination: GeoPoint, origin: GeoPoint | null = null): string {
  const params = new URLSearchParams({ api: '1' });
  if (origin) {
    params.set('origin', `${origin.latitude},${origin.longitude}`);
  }
  params.set('destination', `${destination.latitude},${destination.longitude}`);
  params.set('travelmode', 'walking');
  return `${GOOGLE_MAPS_DIRECTIONS}?${params.toString()}`;
}
