import { Injectable, inject } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import { isValidGeoPoint } from '../../shared/domain/geo-point';
import { RegisterBusiness } from '../domain/model/register-business';
import { RegisteredUser, normalizeEmail } from '../domain/model/register-consumer';
import { IdentityGateway } from '../domain/ports/identity.gateway';

/** Same code Identity answers, so the screen handles a missing point and a rejected one alike. */
export const INVALID_LOCATION = 'INVALID_LOCATION';
const MISSING_LOCATION_MESSAGE = 'Marca en el mapa dónde está tu local.';

/** Registers a business owner with the business profile and its location (US22). */
@Injectable({ providedIn: 'root' })
export class RegisterBusinessUseCase {
  private readonly identity = inject(IdentityGateway);

  execute(owner: RegisterBusiness): Promise<RegisteredUser> {
    if (!isValidGeoPoint(owner.business.location)) {
      return Promise.reject(new ApiError(INVALID_LOCATION, MISSING_LOCATION_MESSAGE));
    }
    return this.identity.registerBusiness({
      ...owner,
      fullName: owner.fullName.trim().replace(/\s+/g, ' '),
      email: normalizeEmail(owner.email),
      phone: owner.phone.replace(/\s+/g, ''),
      business: {
        ...owner.business,
        businessName: owner.business.businessName.trim(),
        businessType: owner.business.businessType.trim(),
        ruc: owner.business.ruc.trim(),
        address: owner.business.address.trim(),
        openingHours: owner.business.openingHours.trim(),
      },
    });
  }
}
