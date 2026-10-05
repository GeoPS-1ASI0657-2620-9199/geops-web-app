import { Injectable, inject } from '@angular/core';
import { RegisterConsumer, RegisteredUser, normalizeEmail } from '../domain/model/register-consumer';
import { IdentityGateway } from '../domain/ports/identity.gateway';

/** Opens a consumer account (US20). */
@Injectable({ providedIn: 'root' })
export class RegisterConsumerUseCase {
  private readonly identity = inject(IdentityGateway);

  execute(person: RegisterConsumer): Promise<RegisteredUser> {
    return this.identity.registerConsumer({
      ...person,
      givenNames: person.givenNames.trim(),
      surnames: person.surnames.trim(),
      email: normalizeEmail(person.email),
      phone: person.phone.replace(/\s+/g, ''),
    });
  }
}
