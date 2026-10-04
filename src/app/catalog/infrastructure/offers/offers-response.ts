
export interface OfferResource {
  /**
   * data types for the Offers API
   */
  id: number;
  campaignId: number;
  title: string;
  partner: string;
  price: number;
  codePrefix: string;
  validUntil: string;
  rating: number;
  location: string;
  category: string;
  imageUrl?: string;
}

export interface OffersResponse {}
