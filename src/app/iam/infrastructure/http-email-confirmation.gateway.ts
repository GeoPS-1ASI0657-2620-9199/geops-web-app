import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import { EmailConfirmationGateway } from '../domain/ports/email-confirmation.gateway';

/** EmailConfirmationGateway over the public route POST /api/v1/auth/email-confirmations. */
@Injectable()
export class HttpEmailConfirmationGateway implements EmailConfirmationGateway {
  /** Without interceptors: the link is opened from the e-mail, with or without a session. */
  private readonly http = new HttpClient(inject(HttpBackend));
  private readonly baseUrl = inject(API_BASE_URL);

  async confirm(token: string): Promise<void> {
    try {
      await firstValueFrom(this.http.post<void>(`${this.baseUrl}/auth/email-confirmations`, { token }));
    } catch (error) {
      throw toApiError(error);
    }
  }
}
