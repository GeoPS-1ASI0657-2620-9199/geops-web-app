import { BaseApiEndpoint } from './base-api-endpoint';
import { User } from '../domain/model/user.entity';
import { UserResource, UsersResponse } from './users-response';
import { UsersAssembler } from './users-assembler';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export class UsersApiEndpoint extends BaseApiEndpoint<
  User,
  UserResource,
  UsersResponse,
  UsersAssembler
> {
  /**
   * Creates an instance of UsersApiEndpoint
   * @param http - The HttpClient to be used for making API requests
   */
  constructor(http: HttpClient) {
    super(
      http,
      `${environment.platformProviderApiBaseUrl}/users`,
      new UsersAssembler()
    );
  }
}
