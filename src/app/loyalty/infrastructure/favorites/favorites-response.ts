
export interface FavoriteRowResource {
  /**
   * data types for the favorites api
   */
  id: number;
  userId: number;  // El backend usa String
  offerId: number; // El backend usa String
  createdAt: string;
}

export interface FavoriteRowsResponse {

}
