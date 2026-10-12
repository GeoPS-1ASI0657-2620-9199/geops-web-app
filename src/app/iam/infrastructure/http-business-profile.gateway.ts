import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { toApiError } from '../../core/http/api-error.mapper';
import {
  BusinessProfile,
  RucVerification,
  VerificationReason,
  VerificationResult,
  VerificationStatus,
} from '../domain/model/business-verification';
import { BusinessProfileGateway } from '../domain/ports/business-profile.gateway';

/** Body of POST /api/v1/business-profiles/{id}/ruc-verifications; the body is optional. */
export interface RucVerificationRequest {
  address: string;
}

/** Body of its 201 answer (identity-service RucVerificationResponse). */
export interface RucVerificationResponse {
  verificationId: number;
  result: VerificationResult;
  reason: VerificationReason | null;
  message: string;
  address: string;
  taxpayerStatus: string | null;
  taxpayerCondition: string | null;
  verificationStatus: VerificationStatus;
  checkedAt: string;
}

/** Body of GET /api/v1/business-profiles/{id}. */
export interface BusinessProfileResponse {
  id: number;
  businessName: string;
  businessType?: string | null;
  ruc: string;
  address: string;
  verificationStatus: VerificationStatus;
  lastVerification: {
    result: VerificationResult;
    reason: VerificationReason | null;
    message: string;
    checkedAt: string;
  } | null;
}

export function toRucVerification(response: RucVerificationResponse): RucVerification {
  return {
    result: response.result,
    reason: response.reason ?? null,
    message: response.message,
    address: response.address,
    verificationStatus: response.verificationStatus,
    checkedAt: response.checkedAt,
  };
}

export function toBusinessProfile(response: BusinessProfileResponse): BusinessProfile {
  const last = response.lastVerification;
  return {
    id: response.id,
    businessName: response.businessName,
    ruc: response.ruc,
    address: response.address,
    verificationStatus: response.verificationStatus,
    lastVerification: last
      ? { result: last.result, reason: last.reason ?? null, message: last.message, checkedAt: last.checkedAt }
      : null,
  };
}

/** BusinessProfileGateway over the gateway route of identity-service. */
@Injectable()
export class HttpBusinessProfileGateway implements BusinessProfileGateway {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/business-profiles`;

  async find(businessId: number): Promise<BusinessProfile> {
    try {
      return toBusinessProfile(await firstValueFrom(this.http.get<BusinessProfileResponse>(`${this.url}/${businessId}`)));
    } catch (error) {
      throw toApiError(error);
    }
  }

  async verify(businessId: number, address: string | null): Promise<RucVerification> {
    const body: RucVerificationRequest | null = address ? { address } : null;
    try {
      const response = await firstValueFrom(
        this.http.post<RucVerificationResponse>(`${this.url}/${businessId}/ruc-verifications`, body),
      );
      return toRucVerification(response);
    } catch (error) {
      throw toApiError(error);
    }
  }
}
