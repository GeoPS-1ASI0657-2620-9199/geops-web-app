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
