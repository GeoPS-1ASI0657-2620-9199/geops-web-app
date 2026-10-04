import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { CartItem } from '../domain/model/cart-item.entity';
import { Cart } from '../domain/model/cart.entity';
import { CartItemResource, CartResource, CartResponse } from './cart-response';

/**
 * Assembler class to convert between Cart entities, resources, and API responses.
 * Implements the BaseAssembler interface.
 * @see BaseAssembler
 * @see Cart
 * @see CartResource
 * @see CartResponse
 */
export class CartAssembler
  implements BaseAssembler<Cart, CartResource, CartResponse>
{
  /**
   * Converts a cart resource to a cart entity
   * @param resource - cart resource from API
   */
  toEntityFromResource(resource: CartResource): Cart {
    return {
      id: resource.id,
      userId: resource.userId,
      items: resource.items.map(this.cartItemToEntity),
      totalItems: resource.totalItems,
      totalAmount: resource.totalAmount,
      createdAt: resource.createdAt,
      updatedAt: resource.updatedAt
    };
  }

  /**
   * Converts a cart entity to a cart resource
   * @param entity - cart entity
   */
  toResourceFromEntity(entity: Cart): CartResource {
    return {
      id: entity.id,
      userId: entity.userId,
      items: entity.items.map(this.cartItemToResource),
      totalItems: entity.totalItems,
      totalAmount: entity.totalAmount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Converts API response to array of cart entities
   * @param response - API response
   */
  toEntitiesFromResponse(response: CartResponse): Cart[] {
    return response.data.map(resource => this.toEntityFromResource(resource));
  }

  private cartItemToEntity(resource: CartItemResource): CartItem {
    return {
      id: resource.id,
      userId: resource.userId,
      offerId: resource.offerId,
      offerTitle: resource.offerTitle,
      offerPrice: resource.offerPrice,
      offerImageUrl: resource.offerImageUrl,
      quantity: resource.quantity,
      total: resource.total
    };
  }

  private cartItemToResource(entity: CartItem): CartItemResource {
    return {
      id: entity.id,
      userId: entity.userId,
      offerId: entity.offerId,
      offerTitle: entity.offerTitle,
      offerPrice: entity.offerPrice,
      offerImageUrl: entity.offerImageUrl,
      quantity: entity.quantity,
      total: entity.total
    };
  }
}
