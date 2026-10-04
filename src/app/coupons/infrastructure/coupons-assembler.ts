import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Coupon } from '../domain/model/coupon.entity';
import { CouponResource, CouponsResponse } from './coupons-response';
import { Offer } from '../../loyalty/domain/model/offer.entity';

/**
 * Assembler to convert between Coupon entities, resources, and API responses.
 * Implements BaseAssembler interface
 * @see BaseAssembler
 * @see Coupon
 * @see CouponResource
 * @see CouponsResponse
 */
export class CouponsAssembler implements BaseAssembler<Coupon, CouponResource, CouponsResponse> {
  /**
   * Converts a resource to a domain entity
   * @param resource - The API resource
   * @returns The domain entity
   */
  toEntityFromResource(resource: CouponResource): Coupon {
    function mapOfferResourceToEntity(r?: any): Offer | undefined {
      if (!r) return undefined;
      return {
        id: r.id,
        title: r.title,
        partner: r.partner,
        price: r.price,
        codePrefix: r.codePrefix,
        validUntil: r.validUntil,
        rating: r.rating,
        location: r.location,
        category: r.category,
        imageUrl: r.imageUrl,
      } as Offer;
    }

    return {
      id: resource.id,
      userId: resource.userId,
      paymentId: resource.paymentId,
      paymentCode: resource.paymentCode,
      productType: resource.productType,
      offerId: typeof resource.offerId === 'string' ? Number(resource.offerId) : resource.offerId,
      offer: mapOfferResourceToEntity(resource.offer),
      code: resource.code,
      expiresAt: resource.expiresAt,
      createdAt: resource.createdAt
    };
  }

  /**
   * Converts a domain entity to a resource
   * @param entity - The domain entity
   * @returns The API resource
   */
  toResourceFromEntity(entity: Coupon): CouponResource {
    return {
      id: entity.id,
      userId: entity.userId,
      paymentId: entity.paymentId,
      paymentCode: entity.paymentCode,
      productType: entity.productType,
      offerId: entity.offerId,
      offer: entity.offer as any,
      code: entity.code,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt
    };
  }

  /**
   * Converts an API response to an array of entities
   * @param response - The API response
   * @returns Array of domain entities
   */
  toEntitiesFromResponse(response: CouponsResponse): Coupon[] {
    return response.data.map(r => this.toEntityFromResource(r));
  }
}
