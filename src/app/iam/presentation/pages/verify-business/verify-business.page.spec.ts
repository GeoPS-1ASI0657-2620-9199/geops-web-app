import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { Session } from '../../../domain/model/session';
import {
  BusinessProfile,
  RucVerification,
  VerificationReason,
} from '../../../domain/model/business-verification';
import { BusinessProfileGateway } from '../../../domain/ports/business-profile.gateway';
import { SessionStorage } from '../../../domain/ports/session.storage';
import { VerifyBusinessPage } from './verify-business.page';

const OWNER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 42,
  role: 'BUSINESS_OWNER',
  email: 'pepe@correo.pe',
  businessId: 84,
  businessName: 'Restaurante Don Pepe',
};
const PROFILE: BusinessProfile = {
  id: 84,
  businessName: 'Restaurante Don Pepe',
  ruc: '20123456786',
  address: 'Av. Larco 345, Miraflores',
  verificationStatus: 'UNVERIFIED',
  lastVerification: null,
};
const answer = (overrides: Partial<RucVerification> = {}): RucVerification => ({
  result: 'APPROVED',
  reason: null,
  message: 'Tu comercio quedó verificado.',
  address: 'Av. Larco 345, Miraflores',
  verificationStatus: 'VERIFIED',
  checkedAt: '2026-10-21T15:04:00Z',
  ...overrides,
});

describe('VerifyBusinessPage', () => {
  let fixture: ComponentFixture<VerifyBusinessPage>;
  let gateway: jasmine.SpyObj<BusinessProfileGateway>;

  const render = async (profile: Promise<BusinessProfile> = Promise.resolve(PROFILE)) => {
    gateway = jasmine.createSpyObj<BusinessProfileGateway>('BusinessProfileGateway', ['find', 'verify']);
    gateway.find.and.returnValue(profile);
    await TestBed.configureTestingModule({
      imports: [VerifyBusinessPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: BusinessProfileGateway, useValue: gateway },
        { provide: SessionStorage, useValue: { read: () => OWNER, write: () => undefined, clear: () => undefined } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(VerifyBusinessPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const host = () => fixture.nativeElement as HTMLElement;
  const byTestId = (id: string) => host().querySelector<HTMLElement>(`[data-testid="${id}"]`);
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };
  const verify = async () => {
    byTestId('verify-business')!.click();
    await settle();
  };
  const typeAddress = (text: string) => {
    const input = host().querySelector<HTMLInputElement>('#address')!;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  it('shows the RUC and the address that will be checked (US38)', async () => {
    await render();

    expect(host().textContent).toContain('20123456786');
    expect(host().textContent).toContain('Av. Larco 345, Miraflores');
    expect(byTestId('verify-business')).not.toBeNull();
  });

  it('marks the business as verified when the RUC is active and habido (CA-38.1)', async () => {
    await render();
    gateway.verify.and.resolveTo(answer());

    await verify();

    expect(gateway.verify).toHaveBeenCalledWith(84, null);
    expect(byTestId('verify-result')?.className).toContain('ok');
    expect(byTestId('verify-result')?.textContent).toContain('verifyBusiness.result.APPROVED');
    expect(byTestId('verify-business')).toBeNull();
  });

  const rejections: VerificationReason[] = ['RUC_NOT_FOUND', 'TAXPAYER_NOT_ACTIVE', 'TAXPAYER_NOT_HABIDO'];
  for (const reason of rejections) {
    it(`says what to fix when the registry rejects with ${reason} (CA-38.2, QAS13)`, async () => {
      await render();
      gateway.verify.and.resolveTo(answer({ result: 'REJECTED', reason, verificationStatus: 'REJECTED', message: 'Rechazado.' }));

      await verify();

      expect(byTestId('verify-result')?.className).toContain('bad');
      expect(byTestId('verify-fix')?.textContent).toContain(`verifyBusiness.reason.${reason}.fix`);
      expect(byTestId('address-form')).toBeNull();
    });
  }

  it('explains that a pending verification arrives by itself (CA-38.4, QAS13)', async () => {
    await render();
    gateway.verify.and.resolveTo(
      answer({ result: 'PENDING', reason: 'GEOCODER_UNAVAILABLE', verificationStatus: 'PENDING', message: 'Pendiente.' }),
    );

    await verify();

    expect(byTestId('verify-result')?.className).toContain('wait');
    expect(byTestId('verify-result')?.textContent).toContain('verifyBusiness.pendingNote');
  });

  it('asks to correct an address it cannot place and keeps what the owner typed (CA-38.3, QAS13)', async () => {
    await render();
    gateway.verify.and.resolveTo(
      answer({ result: 'REJECTED', reason: 'ADDRESS_NOT_GEOCODABLE', verificationStatus: 'REJECTED', address: 'Av Larco s/n' }),
    );
    await verify();

    expect(byTestId('address-form')).not.toBeNull();
    expect(host().querySelector<HTMLInputElement>('#address')!.value).toBe('Av Larco s/n');

    typeAddress('Av. José Larco 345, Miraflores');
    gateway.verify.and.rejectWith(new ApiError(NETWORK_ERROR, 'sin red'));
    byTestId('verify-address')!.click();
    await settle();

    expect(gateway.verify).toHaveBeenCalledWith(84, 'Av. José Larco 345, Miraflores');
    expect(byTestId('verify-error')?.textContent).toContain('verifyBusiness.error.NETWORK_ERROR');
    expect(host().querySelector<HTMLInputElement>('#address')!.value).toBe('Av. José Larco 345, Miraflores');

    gateway.verify.and.resolveTo(
      answer({ result: 'REJECTED', reason: 'ADDRESS_NOT_GEOCODABLE', verificationStatus: 'REJECTED', address: 'Av. José Larco 345, Miraflores' }),
    );
    byTestId('verify-address')!.click();
    await settle();
    expect(host().querySelector<HTMLInputElement>('#address')!.value).toBe('Av. José Larco 345, Miraflores');

    gateway.verify.and.resolveTo(answer({ address: 'Av. José Larco 345, Miraflores' }));
    byTestId('verify-address')!.click();
    await settle();

    expect(byTestId('address-form')).toBeNull();
    expect(host().textContent).toContain('Av. José Larco 345, Miraflores');
  });

  it('shows the last result when the owner comes back to a rejected verification', async () => {
    await render(
      Promise.resolve({
        ...PROFILE,
        verificationStatus: 'REJECTED',
        lastVerification: { result: 'REJECTED', reason: 'TAXPAYER_NOT_HABIDO', message: 'No habido.', checkedAt: '2026-10-21T15:04:00Z' },
      }),
    );

    expect(byTestId('verify-fix')?.textContent).toContain('verifyBusiness.reason.TAXPAYER_NOT_HABIDO.fix');
    expect(byTestId('verify-business')).not.toBeNull();
  });

  it('reads an unknown error code with the generic text', async () => {
    await render();
    gateway.verify.and.rejectWith(new ApiError('INTERNAL_ERROR', 'stack trace'));

    await verify();

    expect(byTestId('verify-error')?.textContent).toContain('verifyBusiness.error.GENERIC');
    expect(byTestId('verify-error')?.textContent).not.toContain('stack trace');
  });

  it('offers to retry when the profile cannot be read', async () => {
    await render(Promise.reject(new ApiError('FORBIDDEN', 'Solo el dueño del negocio puede hacer esta operación.')));

    expect(byTestId('verify-load-error')?.textContent).toContain('verifyBusiness.error.FORBIDDEN');
    expect(byTestId('verify-load-error')?.textContent).not.toContain('Solo el dueño');

    gateway.find.and.resolveTo(PROFILE);
    host().querySelector<HTMLButtonElement>('[data-testid="verify-load-error"] button')!.click();
    await settle();

    expect(byTestId('verify-business')).not.toBeNull();
  });
});
