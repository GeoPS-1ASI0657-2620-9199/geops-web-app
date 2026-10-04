export interface ReviewResource {

  /**
   * data types for the Reviews API
   */
  id: number;
  offerId: number;
  userId: number;
  rating: number;
  text: string;
  likes: number;
  createdAt: string;
}

export interface ReviewsResponse {}
