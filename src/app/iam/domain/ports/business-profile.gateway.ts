import { BusinessProfile, RucVerification } from '../model/business-verification';

/**
 * Port to the business profiles of Identity. Only the owner of the business may call it; the token goes
 * with the interceptor. Implementations reject with ApiError (FORBIDDEN, BUSINESS_PROFILE_NOT_FOUND,
 * INVALID_REQUEST, TAXPAYER_REGISTRY_EMPTY or NETWORK_ERROR).
 */
export abstract class BusinessProfileGateway {
  abstract find(businessId: number): Promise<BusinessProfile>;
  /**
   * Checks the RUC against the registry and geocodes the address. With an address, it replaces the
   * declared one in the same attempt (E2-11); without it, the declared one is checked.
   */
  abstract verify(businessId: number, address: string | null): Promise<RucVerification>;
}
