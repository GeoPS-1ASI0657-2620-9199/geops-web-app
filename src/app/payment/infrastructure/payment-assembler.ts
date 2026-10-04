import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Payment } from '../domain/model/payment.entity';
import { PaymentResource, PaymentResponse } from './payment-response';

/**
 * Assembler class to convert between Payment entities, resources, and API responses.
 * Implements the BaseAssembler interface.
 * @see BaseAssembler
 * @see Payment
 * @see PaymentResource
 * @see PaymentResponse
 */
export class PaymentAssembler
  implements BaseAssembler<Payment, PaymentResource, PaymentResponse>
{
  /**
   * Converts a payment resource to a payment entity
   * @param resource - payment resource from API
   */
  toEntityFromResource(resource: PaymentResource): Payment {
    return {
      id: resource.id,
      userId: resource.userId,
      cartId: resource.cartId,
      amount: resource.amount,
      paymentMethod: resource.paymentMethod,
      status: resource.status,
      customerEmail: resource.customerEmail,
      customerFirstName: resource.customerFirstName,
      customerLastName: resource.customerLastName,
      paymentCode: resource.paymentCode,
      createdAt: resource.createdAt,
      completedAt: resource.completedAt
    };
  }

  /**
   * Converts a payment entity to a payment resource
   * @param entity - payment entity
   */
  toResourceFromEntity(entity: Payment): PaymentResource {
    return {
      id: entity.id,
      userId: entity.userId,
      cartId: entity.cartId,
      amount: entity.amount,
      paymentMethod: entity.paymentMethod,
      status: entity.status,
      customerEmail: entity.customerEmail,
      customerFirstName: entity.customerFirstName,
      customerLastName: entity.customerLastName,
      paymentCode: entity.paymentCode,
      createdAt: entity.createdAt,
      completedAt: entity.completedAt
    };
  }

  /**
   * Converts API response to array of payment entities
   * @param response - API response
   */
  toEntitiesFromResponse(response: PaymentResponse): Payment[] {
    return response.data.map(resource => this.toEntityFromResource(resource));
  }
}
