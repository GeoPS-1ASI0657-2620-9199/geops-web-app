import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { RegisterBusiness } from '../domain/model/register-business';
import { RegisterConsumer, RegisteredUser } from '../domain/model/register-consumer';
import { Credentials, IssuedToken } from '../domain/model/session';
import { IdentityGateway } from '../domain/ports/identity.gateway';
import {
  RegisteredUserResponse,
  TokenResponse,
  toIssuedToken,
  toLogInRequest,
  toRegisterBusinessRequest,
  toRegisterConsumerRequest,
  toRegisteredUser,
} from './identity.mapper';

/** IdentityGateway over the gateway routes of identity-service (/api/v1/auth/*). */
@Injectable()
export class HttpIdentityGateway implements IdentityGateway {
  private readonly http = inject(HttpClient);
  /** Without interceptors: the session is already closed here and a 401 must not log out again. */
  private readonly bare = new HttpClient(inject(HttpBackend));
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

  async registerBusiness(owner: RegisterBusiness): Promise<RegisteredUser> {
    try {
      const response = await firstValueFrom(
        this.http.post<RegisteredUserResponse>(
          `${this.baseUrl}/auth/register`,
          toRegisterBusinessRequest(owner),
        ),
      );
      return toRegisteredUser(response);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async logIn(credentials: Credentials): Promise<IssuedToken> {
    try {
      const response = await firstValueFrom(
        this.http.post<TokenResponse>(`${this.baseUrl}/auth/login`, toLogInRequest(credentials)),
      );
      return toIssuedToken(response);
    } catch (error) {
      throw toApiError(error);
    }
  }

  async logOut(accessToken: string): Promise<void> {
    await firstValueFrom(
      this.bare.post<void>(`${this.baseUrl}/auth/logout`, null, { headers: { Authorization: `Bearer ${accessToken}` } }),
    );
  }
}
