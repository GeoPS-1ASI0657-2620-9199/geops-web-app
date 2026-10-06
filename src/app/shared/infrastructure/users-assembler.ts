import { BaseAssembler } from './base-assembler';
import { User } from '../domain/model/user.entity';
import { UserResource, UsersResponse } from './users-response';

/**
 * Assembler to transform between User entities and resources
 */
export class UsersAssembler implements BaseAssembler<
  User,
  UserResource,
  UsersResponse
> {
  /**
   * Converts a resource to a domain entity
   * @param resource - The API resource
   * @returns The domain entity
   */
  toEntityFromResource(resource: UserResource): User {
    return {
      id: resource.id,
      name: resource.name,
      email: resource.email,
      password: resource.password,
      phone: resource.phone,
      role: resource.role,
      plan: resource.plan
    };
  }

  /**
   * Converts a domain entity to a resource
   * @param entity - The domain entity
   * @returns The API resource
   */
  toResourceFromEntity(entity: User): UserResource {
    return {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      password: entity.password,
      phone: entity.phone,
      role: entity.role,
      plan: entity.plan
    };
  }

  /**
   * Converts an API response to an array of entities
   * @param response - The API response
   * @returns Array of domain entities
   */
  toEntitiesFromResponse(response: UsersResponse): User[] {
    return response.users.map(resource => this.toEntityFromResource(resource));
  }
}
