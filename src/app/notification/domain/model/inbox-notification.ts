/** One notice of the user's inbox, as notification-service lists it. */
export interface InboxNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  /** Only the offer notices carry it; null in the rest. */
  offerId: number | null;
  createdAt: string;
  read: boolean;
}
