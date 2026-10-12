/** Status of the business profile in identity-service (verification_status). */
export const VERIFICATION_STATUSES = ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

/** Outcome of one attempt against the SUNAT registry and the geocoder (E2-11). */
export type VerificationResult = 'APPROVED' | 'REJECTED' | 'PENDING';

/**
 * Why an attempt was not approved. GEOCODER_UNAVAILABLE goes with PENDING: Identity retries by itself.
 * INVALID_RUC is the answer of the register when the check digit is wrong.
 */
export const VERIFICATION_REASONS = [
  'RUC_NOT_FOUND',
  'TAXPAYER_NOT_ACTIVE',
  'TAXPAYER_NOT_HABIDO',
  'ADDRESS_NOT_GEOCODABLE',
  'GEOCODER_UNAVAILABLE',
  'INVALID_RUC',
] as const;
export type VerificationReason = (typeof VERIFICATION_REASONS)[number];

/** Same limit as the address of the business profile in identity-service. */
export const ADDRESS_MAX_LENGTH = 255;

/** One verification attempt as Identity answers it (RucVerificationResponse). */
export interface RucVerification {
  readonly result: VerificationResult;
  readonly reason: VerificationReason | null;
  /** Already written for the owner by Identity. */
  readonly message: string;
  /** The address that was checked. */
  readonly address: string;
  /** Status of the profile after the attempt; a verified business keeps it if only a new address fails. */
  readonly verificationStatus: VerificationStatus;
  readonly checkedAt: string;
}

/** The business of the owner in session, with what the verification needs (US38). */
export interface BusinessProfile {
  readonly id: number;
  readonly businessName: string;
  readonly ruc: string;
  readonly address: string;
  readonly verificationStatus: VerificationStatus;
  readonly lastVerification: Pick<RucVerification, 'result' | 'reason' | 'message' | 'checkedAt'> | null;
}

export function isVerified(status: VerificationStatus | null | undefined): boolean {
  return status === 'VERIFIED';
}

/** The only rejection the owner fixes on this screen: the address (CA-38.3, QAS13). */
export function asksForAddress(reason: VerificationReason | null | undefined): boolean {
  return reason === 'ADDRESS_NOT_GEOCODABLE';
}
