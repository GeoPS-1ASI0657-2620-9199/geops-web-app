import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoSeal, SealKind } from '../../../../shared/ui/geo-seal/geo-seal';
import { INVALID_ADDRESS, NO_BUSINESS, VerifyBusinessUseCase } from '../../../application/verify-business.use-case';
import {
  ADDRESS_MAX_LENGTH,
  BusinessProfile,
  RucVerification,
  VerificationStatus,
  asksForAddress,
} from '../../../domain/model/business-verification';

type ViewState = 'loading' | 'ready' | 'error';

/** Error codes with their own text in verifyBusiness.error.<CODE>; any other reads GENERIC. */
const ERROR_CODES = [
  NO_BUSINESS,
  INVALID_ADDRESS,
  NETWORK_ERROR,
  'INVALID_REQUEST',
  'FORBIDDEN',
  'UNAUTHORIZED',
  'BUSINESS_PROFILE_NOT_FOUND',
  'TAXPAYER_REGISTRY_EMPTY',
];

/** Translation key of an error; the text never comes from the service or the code. */
export function errorKeyOf(error: unknown): string {
  const code = error instanceof ApiError ? error.code : '';
  return `verifyBusiness.error.${ERROR_CODES.includes(code) ? code : 'GENERIC'}`;
}

/** Seal of each profile status; the label comes from verifyBusiness.status.<STATUS>. */
export const STATUS_SEAL: Record<VerificationStatus, SealKind> = {
  VERIFIED: 'verified',
  PENDING: 'pending',
  REJECTED: 'reported',
  UNVERIFIED: 'unverified',
};

/** Tone of the result box of each outcome. */
const RESULT_TONE: Record<RucVerification['result'], 'ok' | 'wait' | 'bad'> = {
  APPROVED: 'ok',
  PENDING: 'wait',
  REJECTED: 'bad',
};

/**
 * "Verificar mi comercio" (US38, QAS13): one short step of the first use of the business. It shows the
 * RUC and the address that will be checked, and after the attempt what happened and what to fix. When
 * the address cannot be placed on the map the owner corrects it right here; what was typed is never
 * cleared, not even when the new attempt fails.
 */
@Component({
  selector: 'app-verify-business',
  standalone: true,
  imports: [FormsModule, RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoSeal],
  templateUrl: './verify-business.page.html',
  styleUrl: './verify-business.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyBusinessPage implements OnInit {
  private readonly verification = inject(VerifyBusinessUseCase);

  protected readonly state = signal<ViewState>('loading');
  protected readonly profile = signal<BusinessProfile | null>(null);
  protected readonly verifying = signal(false);
  protected readonly result = signal<RucVerification | null>(null);
  /** Translation key of the last error. */
  protected readonly errorKey = signal('verifyBusiness.error.GENERIC');
  /** The last attempt could not reach a result (network, validation or a refusal of Identity). */
  protected readonly failed = signal(false);
  /** The corrected address; once shown it keeps what the owner typed across attempts (QAS13). */
  protected readonly address = signal('');
  protected readonly correcting = signal(false);
  protected readonly maxAddress = ADDRESS_MAX_LENGTH;
  protected readonly seals = STATUS_SEAL;

  protected readonly status = computed(
    () => this.result()?.verificationStatus ?? this.profile()?.verificationStatus ?? 'UNVERIFIED',
  );
  protected readonly tone = computed(() => {
    const result = this.result();
    return result ? RESULT_TONE[result.result] : null;
  });
  protected readonly canVerify = computed(() => this.status() !== 'VERIFIED' || this.correcting());

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      const profile = await this.verification.profile();
      this.profile.set(profile);
      if (profile.lastVerification && profile.verificationStatus !== 'VERIFIED') {
        this.showResult({ ...profile.lastVerification, address: profile.address, verificationStatus: profile.verificationStatus });
      }
      this.state.set('ready');
    } catch (error) {
      this.errorKey.set(errorKeyOf(error));
      this.state.set('error');
    }
  }

  async verify(): Promise<void> {
    if (this.verifying()) {
      return;
    }
    this.verifying.set(true);
    this.failed.set(false);
    try {
      const result = await this.verification.verify(this.correcting() ? this.address() : null);
      this.showResult(result);
      this.profile.update((profile) =>
        profile ? { ...profile, address: result.address, verificationStatus: result.verificationStatus } : profile,
      );
    } catch (error) {
      this.errorKey.set(errorKeyOf(error));
      this.failed.set(true);
    } finally {
      this.verifying.set(false);
    }
  }

  private showResult(result: RucVerification): void {
    this.result.set(result);
    if (asksForAddress(result.reason)) {
      // First time: start from the address that failed. Later: keep what the owner typed.
      if (!this.correcting()) {
        this.address.set(result.address);
      }
      this.correcting.set(true);
    } else if (result.result === 'APPROVED') {
      this.correcting.set(false);
    }
  }
}
