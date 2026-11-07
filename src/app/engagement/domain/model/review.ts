export interface Review {
  reviewId: number;
  businessId: number;
  rating: number;
  text: string;
  verifiedRedemption: boolean;
  createdAt: string;
  reply: { text: string; repliedAt: string } | null;
}
export interface ReviewInput { businessId: number; rating: number; text: string; }
