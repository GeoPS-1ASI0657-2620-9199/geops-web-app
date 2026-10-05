import { GeoPoint } from '../../../shared/domain/geo-point';

/** Where an offer comes from: an affiliated business or a public source without guarantee. */
export type OfferSource = 'AFFILIATED' | 'PUBLIC_SOURCE';

/** The offer as GET /api/v1/offers/{id} returns it (BRD-05 §7.2, US04). */
export interface OfferDetail {
  readonly offerId: number;
  readonly title: string;
  readonly conditions: string;
  readonly price: number;
  /** Last valid day, ISO date (yyyy-mm-dd). */
  readonly validTo: string;
  readonly category: string;
  readonly address: string;
  readonly location: GeoPoint;
  readonly imageUrl: string | null;
  readonly source: OfferSource;
  /** Null for a public source offer, whose business is not affiliated. */
  readonly businessId: number | null;
  readonly businessName: string;
  readonly verifiedSeal: boolean;
  /** Catalog decides it: false once the offer expired or left the catalog (CA-04.2). */
  readonly available: boolean;
}
