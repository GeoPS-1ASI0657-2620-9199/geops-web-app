import { GeoPoint } from '../../../shared/domain/geo-point';

/**
 * An offer a public source published for a business that is not affiliated (US39, E2-08). It carries
 * no seal and no guarantee, so the screens show it apart from the affiliated offers.
 */
export interface PublicSourceOffer {
  readonly offerId: number;
  readonly title: string;
  /** Who published it, e.g. "Municipalidad de Lima"; shown instead of a business. */
  readonly sourceName: string;
  readonly distanceMeters: number;
  readonly walkMinutes: number;
  readonly category: string;
  readonly address: string;
  readonly imageUrl: string | null;
  readonly location: GeoPoint;
  readonly price: number;
  /** Last valid day, ISO date (yyyy-mm-dd). */
  readonly validTo: string;
}
