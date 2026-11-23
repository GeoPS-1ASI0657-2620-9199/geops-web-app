/** An offer a business has open today, as Engagement lists it under a saved or followed business. */
export interface ActiveOffer {
  offerId: number;
  title: string;
  /** Last day, yyyy-MM-dd. */
  validTo: string;
}
