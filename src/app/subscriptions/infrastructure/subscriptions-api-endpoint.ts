import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionsResponse } from './subscriptions-response';
import { SubscriptionsAssembler } from './subscriptions-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

/**
 * API endpoint for subscriptions
 * extends BaseApiEndpoint with Subscription entity, SubscriptionResource, SubscriptionsResponse, and SubscriptionsAssembler
 * @see BaseApiEndpoint
 * @see Subscription
 * @see SubscriptionResource
 * @see SubscriptionsResponse
 * @see SubscriptionsAssembler
 */
export class SubscriptionsApiEndpoint extends BaseApiEndpoint<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse,
  SubscriptionsAssembler
> {
  /**
   * Creates an instance of SubscriptionsApiEndpoint
   * @param http - The HttpClient to be used for making API requests
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}${environment.platformProviderSubscriptionsEndpointPath}`,
      new SubscriptionsAssembler()
    );
  }
}
