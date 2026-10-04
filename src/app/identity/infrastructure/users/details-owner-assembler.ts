import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { DetailsOwner } from '../../domain/model/details-owner.entity';
import { DetailsOwnerResource, DetailsOwnerResponse } from './details-owner-response';

/**
 * Assembler for converting between DetailsOwner entity and API resources.
 */
export class DetailsOwnerAssembler implements BaseAssembler<
  DetailsOwner,
  DetailsOwnerResource,
  DetailsOwnerResponse
> {
  /**
   * Converts a DetailsOwnerResource to a DetailsOwner entity.
   * @param resource The resource from the API
   * @returns The DetailsOwner entity
   */
  toEntityFromResource(resource: DetailsOwnerResource): DetailsOwner {
    return {
      id: resource.id,
      userId: resource.userId,
      businessName: resource.businessName,
      businessType: resource.businessType,
      taxId: resource.taxId,
      website: resource.website,
      description: resource.description,
      address: resource.address,
      horarioAtencion: resource.horarioAtencion,
      createdAt: resource.createdAt ? new Date(resource.createdAt) : undefined,
      updatedAt: resource.updatedAt ? new Date(resource.updatedAt) : undefined
    };
  }

  /**
   * Converts a DetailsOwner entity to a DetailsOwnerResource.
   * @param entity The DetailsOwner entity
   * @returns The resource for the API
   */
  toResourceFromEntity(entity: DetailsOwner): DetailsOwnerResource {
    return {
      id: entity.id,
      userId: entity.userId,
      businessName: entity.businessName,
      businessType: entity.businessType,
      taxId: entity.taxId,
      website: entity.website,
      description: entity.description,
      address: entity.address,
      horarioAtencion: entity.horarioAtencion,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Converts a DetailsOwnerResponse to an array of DetailsOwner entities.
   * @param response The response from the API
   * @returns Array of DetailsOwner entities
   */
  toEntitiesFromResponse(response: DetailsOwnerResponse): DetailsOwner[] {
    return [];
  }
}

