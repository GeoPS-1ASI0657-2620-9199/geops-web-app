import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { RegisterConsumer, RegisteredUser } from '../domain/model/register-consumer';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import {
  RegisteredUserResponse,
  toRegisterConsumerRequest,
  toRegisteredUser,
} from './identity.mapper';

/** IdentityGateway over the gateway routes of identity-service (/api/v1/auth/*). */
@Injectable()
export class HttpIdentityGateway implements IdentityGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  async registerConsumer(person: RegisterConsumer): Promise<RegisteredUser> {
    try {
      const response = await firstValueFrom(
        this.http.post<RegisteredUserResponse>(
          `${this.baseUrl}/auth/register`,
          toRegisterConsumerRequest(person),
        ),
      );
      return toRegisteredUser(response);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
