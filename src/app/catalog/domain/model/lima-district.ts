import { GeoPoint } from '../../../shared/domain/geo-point';

/** A district of Lima Metropolitana and the point the search starts from (QAS12, E-11). */
export interface LimaDistrict {
  readonly name: string;
  readonly center: GeoPoint;
}
