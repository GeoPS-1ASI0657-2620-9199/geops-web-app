import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { DetailsConsumer } from '../../domain/model/details-consumer.entity';
import { DetailsConsumerResource, DetailsConsumerResponse } from './details-consumer-response';

/**
 * Assembler for converting between DetailsConsumer entity and API resources.
 */
export class DetailsConsumerAssembler implements BaseAssembler<
  DetailsConsumer,
  DetailsConsumerResource,
  DetailsConsumerResponse
> {
  /**
   * Converts a DetailsConsumerResource to a DetailsConsumer entity.
   * @param resource The resource from the API
   * @returns The DetailsConsumer entity
   */
  toEntityFromResource(resource: DetailsConsumerResource): DetailsConsumer {
    return {
      id: resource.id,
      userId: resource.userId,
      categoriasFavoritas: resource.categoriasFavoritas,
      recibirNotificaciones: resource.recibirNotificaciones ?? false,
      permisoUbicacion: resource.permisoUbicacion ?? false,
      direccionCasa: resource.direccionCasa,
      direccionTrabajo: resource.direccionTrabajo,
      direccionUniversidad: resource.direccionUniversidad,
      createdAt: resource.createdAt ? new Date(resource.createdAt) : undefined,
      updatedAt: resource.updatedAt ? new Date(resource.updatedAt) : undefined
    };
  }

  /**
   * Converts a DetailsConsumer entity to a DetailsConsumerResource.
   * @param entity The DetailsConsumer entity
   * @returns The resource for the API
   */
  toResourceFromEntity(entity: DetailsConsumer): DetailsConsumerResource {
    return {
      id: entity.id,
      userId: entity.userId,
      categoriasFavoritas: entity.categoriasFavoritas,
      recibirNotificaciones: entity.recibirNotificaciones,
      permisoUbicacion: entity.permisoUbicacion,
      direccionCasa: entity.direccionCasa,
      direccionTrabajo: entity.direccionTrabajo,
      direccionUniversidad: entity.direccionUniversidad,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Converts a DetailsConsumerResponse to an array of DetailsConsumer entities.
   * @param response The response from the API
   * @returns Array of DetailsConsumer entities
   */
  toEntitiesFromResponse(response: DetailsConsumerResponse): DetailsConsumer[] {
    return [];
  }
}

