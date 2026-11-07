export abstract class PushProvider {
  abstract enable(): Promise<string>;
  abstract disable(): Promise<void>;
}
export abstract class PushSubscriptionsRepository {
  abstract register(fcmToken: string): Promise<{ subscriptionId: number; createdAt: string }>;
  abstract remove(subscriptionId: number): Promise<void>;
}
export abstract class PushSubscriptionStorage {
  abstract read(userId: number): number | null;
  abstract write(userId: number, subscriptionId: number): void;
  abstract clear(userId: number): void;
}
