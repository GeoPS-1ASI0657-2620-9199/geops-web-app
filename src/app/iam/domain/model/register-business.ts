import { GeoPoint } from '../../../shared/domain/geo-point';

/** Same limits that identity-service validates in BusinessProfileRequest and Ruc. */
export const BUSINESS_NAME_MAX_LENGTH = 150;
export const BUSINESS_TYPE_MAX_LENGTH = 100;
export const ADDRESS_MAX_LENGTH = 255;
export const OPENING_HOURS_MAX_LENGTH = 255;
export const RUC_PATTERN = /^\d{11}$/;

/** The business as the owner describes it (US22). */
export interface BusinessProfile {
  readonly businessName: string;
  readonly businessType: string;
  readonly ruc: string;
  readonly address: string;
  readonly location: GeoPoint;
  readonly openingHours: string;
}

/** Owner account plus its business, sent to Identity in one request. */
export interface RegisterBusiness {
  readonly fullName: string;
  readonly email: string;
  readonly phone: string;
  readonly password: string;
  readonly business: BusinessProfile;
}
