import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { EmailConfirmationGateway } from '../domain/ports/email-confirmation.gateway';

/** The link was opened without its token; the screen explains it without calling the server. */
export const MISSING_CONFIRMATION_TOKEN = 'MISSING_CONFIRMATION_TOKEN';
/** Answer of identity-service for an unknown, used or expired link. */
export const INVALID_CONFIRMATION_LINK = 'INVALID_CONFIRMATION_LINK';

/** Confirms the e-mail of an account with the token of the link it received (US28). */
@Injectable({ providedIn: 'root' })
export class ConfirmEmailUseCase {
  private readonly confirmations = inject(EmailConfirmationGateway);

  async execute(token: string | null): Promise<void> {
    const value = token?.trim();
    if (!value) {
      throw new ApiError(MISSING_CONFIRMATION_TOKEN, MISSING_CONFIRMATION_TOKEN);
    }
    await this.confirmations.confirm(value);
  }
}
