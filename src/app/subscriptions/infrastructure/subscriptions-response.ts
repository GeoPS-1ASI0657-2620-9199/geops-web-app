import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';

/**
 * Subscription resource from the API
 * extends BaseResource
 * @property price - The price of the subscription
 * @property recommended - Whether the subscription is recommended
 * @property type - The type of subscription ('BASIC' | 'PREMIUM')
 */
export interface SubscriptionResource extends BaseResource {
  price: number;
  recommended: boolean;
  type: 'BASIC' | 'PREMIUM';
}

/**
 * API response for multiple subscriptions
 * extends BaseResponse
 * @property subscriptions - Array of SubscriptionResource objects
 */
export interface SubscriptionsResponse extends BaseResponse {
  subscriptions: SubscriptionResource[];
}
