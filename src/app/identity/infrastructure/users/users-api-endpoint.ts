import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BaseApiEndpoint } from '../../../shared/infrastructure/base-api-endpoint';
import { map, Observable } from 'rxjs';
import { User } from '../../domain/model/user.entity';
import { UserResource, UsersResponse, AuthenticationResource } from './users-response';
import { UsersAssembler } from './users-assembler';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
/**
 * API endpoint service for user-related operations.
 * Extends BaseApiEndpoint to provide CRUD and custom user methods.
 */
export class UsersApiEndpoint extends BaseApiEndpoint<
  User,
  UserResource,
  UsersResponse,
  UsersAssembler
> {
  /**
   * Initializes the UsersApiEndpoint with the base URL and assembler.
   * @param http Angular HttpClient for HTTP requests
   */
  constructor(http: HttpClient) {
    super(http, `${environment.platformProviderApiBaseUrl}/users`, new UsersAssembler());
  }

  /**
   * Retrieves users filtered by role.
   * @param role User role to filter by ('OWNER' or 'CONSUMER')
   * @returns Observable with an array of User entities
   */
  getByRole(role: 'OWNER' | 'CONSUMER'): Observable<User[]> {
    return this.http
      .get<UserResource[]>(`${this.endpointUrl}?role=${encodeURIComponent(role)}`)
      .pipe(map(list => list.map(r => this.assembler.toEntityFromResource(r))));
  }

  /**
   * Registers a new user using the authentication endpoint.
   * @param signUpData Sign up data containing name, email, phone, password, role, and plan
   * @returns Observable with the AuthenticationResource
   */
  register(signUpData: { name: string; email: string; phone: string; password: string; role?: string; plan?: string }): Observable<AuthenticationResource> {
    // Preparar los datos para enviar al backend
    const payload = {
      name: signUpData.name,
      email: signUpData.email,
      phone: signUpData.phone,
      password: signUpData.password,
      role: signUpData.role || 'CONSUMER',  // Default a CONSUMER si no se especifica
      plan: signUpData.plan || 'BASIC'      // Default a BASIC si no se especifica
    };

    return this.http.post<AuthenticationResource>(
      `${environment.platformProviderApiBaseUrl}/authentication/sign-up`,
      payload
    );
  }

  /**
   * Login user with email and password using POST request.
   * @param email User's email
   * @param password User's password
   * @returns Observable with the AuthenticationResource
   */
  login(email: string, password: string): Observable<AuthenticationResource> {
    const loginBody = { email, password };
    return this.http.post<AuthenticationResource>(
      `${environment.platformProviderApiBaseUrl}/authentication/sign-in`,
      loginBody
    );
  }

  /**
   * Gets the current authenticated user's information.
   * @param email User's email (from security context)
   * @returns Observable with the User entity
   */
  getMe(email: string): Observable<User> {
    return this.http
      .get<UserResource>(`${this.endpointUrl}/me?email=${encodeURIComponent(email)}`)
      .pipe(map(resource => this.assembler.toEntityFromResource(resource)));
  }

  /**
   * Updates an existing user entity.
   * @param entity User entity to update
   * @param id User ID
   * @returns Observable with the updated User entity
   */
  override update(entity: User, id: number): Observable<User> {
    const resource = this.assembler.toResourceFromEntity(entity);
    return this.http.put<UserResource>(`${this.endpointUrl}/${id}`, resource).pipe(
      map(updated => this.assembler.toEntityFromResource(updated))
    );
  }
}


