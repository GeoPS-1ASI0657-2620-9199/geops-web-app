export interface Review {
  reviewId: number;
  businessId: number;
  /** First name and initial of the surname ("Lucía F."); null for reviews published before it was kept. */
  authorName: string | null;
  rating: number;
  text: string;
  verifiedRedemption: boolean;
  createdAt: string;
  reply: { text: string; repliedAt: string } | null;
}
export interface ReviewInput { businessId: number; rating: number; text: string; }
