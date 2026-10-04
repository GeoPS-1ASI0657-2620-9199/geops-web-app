import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Subscription } from '../domain/model/subscription.entity';
import { SubscriptionResource, SubscriptionsResponse } from './subscriptions-response';

/**
 * Assembler to transform between Subscription entities and resources
 * implements BaseAssembler interface
 * @see BaseAssembler
 * @see Subscription
 * @see SubscriptionResource
 * @see SubscriptionsResponse
 */
export class SubscriptionsAssembler implements BaseAssembler<
  Subscription,
  SubscriptionResource,
  SubscriptionsResponse
> {
  /**
   * Converts a resource to a domain entity
   * @param resource - The API resource
   * @returns The domain entity
   */
  toEntityFromResource(resource: SubscriptionResource): Subscription {
    return {
      id: resource.id,
      price: resource.price,
      recommended: resource.recommended,
      type: resource.type
    };
  }

  /**
   * Converts a domain entity to a resource
   * @param entity - The domain entity
   * @returns The API resource
   */
  toResourceFromEntity(entity: Subscription): SubscriptionResource {
    return {
      id: entity.id,
      price: entity.price,
      recommended: entity.recommended,
      type: entity.type
    };
  }

  /**
   * Converts an API response to an array of entities
   * @param response - The API response
   * @returns Array of domain entities
   */
  toEntitiesFromResponse(response: SubscriptionsResponse): Subscription[] {
    return response.subscriptions.map(resource => this.toEntityFromResource(resource));
  }
}
