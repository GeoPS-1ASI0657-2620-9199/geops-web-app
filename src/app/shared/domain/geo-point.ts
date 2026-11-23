/** A point on the map in decimal degrees (WGS84), the format every GeoPS service exchanges. */
export interface GeoPoint {
  readonly latitude: number;
  readonly longitude: number;
}

const MAX_LATITUDE = 90;
const MAX_LONGITUDE = 180;

export function isValidGeoPoint(point: GeoPoint | null | undefined): point is GeoPoint {
  return (
    !!point &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= MAX_LATITUDE &&
    Math.abs(point.longitude) <= MAX_LONGITUDE
  );
}

const EARTH_RADIUS_METERS = 6_371_000;

/** Straight-line distance in meters between two points (haversine), rounded to the meter. */
export function metersBetween(from: GeoPoint, to: GeoPoint): number {
  const rad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = rad(to.latitude - from.latitude);
  const dLng = rad(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(from.latitude)) * Math.cos(rad(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a)));
}
