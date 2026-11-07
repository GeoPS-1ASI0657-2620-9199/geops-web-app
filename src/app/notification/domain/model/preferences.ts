export interface NotificationPreferences { pushEnabled: boolean; emailEnabled: boolean; dailyLimit: number; updatedAt?: string; }
export interface EmailUnsubscription { notificationType: 'NEARBY_OFFER' | 'FOLLOWED_BUSINESS_OFFER'; unsubscribedAt: string; }
export interface LastLocation { latitude: number; longitude: number; accuracyMeters: number; capturedAt: string; }
