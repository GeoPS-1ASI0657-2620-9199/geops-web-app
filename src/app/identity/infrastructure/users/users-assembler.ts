import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { User } from '../../domain/model/user.entity';
import { UserResource, UsersResponse } from './users-response';

/**
 * Assembler for converting between User entities and resources.
 */
export class UsersAssembler implements BaseAssembler<User, UserResource, UsersResponse> {
  /**
   * Converts a UserResource to a User entity.
   * @param resource The resource from the API
   * @returns The User entity
   */
  toEntityFromResource(resource: UserResource): User {
    return {
      id: resource.id,
      name: resource.name,
      email: resource.email,
      phone: resource.phone,
      role: resource.role,
      plan: resource.plan,
      createdAt: resource.createdAt ? new Date(resource.createdAt) : undefined,
      updatedAt: resource.updatedAt ? new Date(resource.updatedAt) : undefined
    };
  }

  /**
   * Converts a User entity to a UserResource.
   * @param entity The User entity
   * @returns The resource for the API
   */
  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      phone: entity.phone,
      role: entity.role,
      plan: entity.plan,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }

  /**
   * Converts a UsersResponse to an array of User entities.
   * @param response The response from the API
   * @returns Array of User entities
   */
  toEntitiesFromResponse(response: UsersResponse): User[] {
    return [];
  }
}


