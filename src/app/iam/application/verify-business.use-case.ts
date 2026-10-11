import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiError } from '../../shared/domain/api-error';
import {
  ADDRESS_MAX_LENGTH,
  BusinessProfile,
  RucVerification,
  VerificationStatus,
} from '../domain/model/business-verification';
import { BusinessProfileGateway } from '../domain/ports/business-profile.gateway';
import { SessionStore } from './session.store';

export const NO_BUSINESS = 'NO_BUSINESS';
export const INVALID_ADDRESS = 'INVALID_ADDRESS';
const NO_BUSINESS_MESSAGE = 'Tu sesión no corresponde a un comercio. Vuelve a iniciar sesión.';
const INVALID_ADDRESS_MESSAGE = `Escribe la dirección del local, con calle y número, en hasta ${ADDRESS_MAX_LENGTH} caracteres.`;

/**
 * The verification of the business of the owner in session (US38). It also keeps the last status it
 * read, so the seal of the panel and of the campaign form follows a new verification without
 * reloading (E2-16).
 */
@Injectable({ providedIn: 'root' })
export class VerifyBusinessUseCase {
  private readonly profiles = inject(BusinessProfileGateway);
  private readonly sessions = inject(SessionStore);
  private readonly known = signal<{ businessId: number; status: VerificationStatus } | null>(null);

  /** The last status read for the business in session; null until its profile was read. */
  readonly verificationStatus = computed(() => {
    const known = this.known();
    return known && known.businessId === this.sessions.session()?.businessId ? known.status : null;
  });

  async profile(): Promise<BusinessProfile> {
    const businessId = this.businessId();
    const profile = await this.profiles.find(businessId);
    this.known.set({ businessId, status: profile.verificationStatus });
    return profile;
  }

  /** Verifies the declared address, or the corrected one when the owner typed it (QAS13). */
  async verify(correctedAddress: string | null = null): Promise<RucVerification> {
    const address = correctedAddress?.trim() || null;
    if (correctedAddress !== null && (!address || address.length > ADDRESS_MAX_LENGTH)) {
      throw new ApiError(INVALID_ADDRESS, INVALID_ADDRESS_MESSAGE);
    }
    const businessId = this.businessId();
    const verification = await this.profiles.verify(businessId, address);
    this.known.set({ businessId, status: verification.verificationStatus });
    return verification;
  }

  private businessId(): number {
    const businessId = this.sessions.activeSession()?.businessId;
    if (!businessId) {
      throw new ApiError(NO_BUSINESS, NO_BUSINESS_MESSAGE);
    }
    return businessId;
  }
}
