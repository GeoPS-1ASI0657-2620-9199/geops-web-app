import { TestBed } from '@angular/core/testing';
import { Session } from '../domain/model/session';
import { BusinessProfileGateway } from '../domain/ports/business-profile.gateway';
import { SessionStorage } from '../domain/ports/session.storage';
import { INVALID_ADDRESS, NO_BUSINESS, VerifyBusinessUseCase } from './verify-business.use-case';
import { SessionStore } from './session.store';

const OWNER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 42,
  role: 'BUSINESS_OWNER',
  email: 'pepe@correo.pe',
  businessId: 84,
};
const VERIFIED = {
  result: 'APPROVED' as const,
  reason: null,
  message: 'ok',
  address: 'Av. Larco 345, Miraflores',
  verificationStatus: 'VERIFIED' as const,
  checkedAt: '2026-10-21T15:04:00Z',
};

describe('VerifyBusinessUseCase', () => {
  let gateway: jasmine.SpyObj<BusinessProfileGateway>;
  let useCase: VerifyBusinessUseCase;

  const create = (session: Session | null) => {
    gateway = jasmine.createSpyObj<BusinessProfileGateway>('BusinessProfileGateway', ['find', 'verify']);
    TestBed.configureTestingModule({
      providers: [
        { provide: BusinessProfileGateway, useValue: gateway },
        { provide: SessionStorage, useValue: { read: () => session, write: () => undefined, clear: () => undefined } },
      ],
    });
    useCase = TestBed.inject(VerifyBusinessUseCase);
  };

  it('verifies the business of the session and keeps its new status for the seal (E2-16)', async () => {
    create(OWNER);
    gateway.verify.and.resolveTo(VERIFIED);
    expect(useCase.verificationStatus()).toBeNull();

    await useCase.verify();

    expect(gateway.verify).toHaveBeenCalledWith(84, null);
    expect(useCase.verificationStatus()).toBe('VERIFIED');
  });

  it('sends the corrected address trimmed and refuses an empty or too long one', async () => {
    create(OWNER);
    gateway.verify.and.resolveTo(VERIFIED);

    await useCase.verify('  Av. José Larco 345  ');
    expect(gateway.verify).toHaveBeenCalledWith(84, 'Av. José Larco 345');

    await expectAsync(useCase.verify('   ')).toBeRejectedWith(jasmine.objectContaining({ code: INVALID_ADDRESS }));
    await expectAsync(useCase.verify('x'.repeat(256))).toBeRejectedWith(jasmine.objectContaining({ code: INVALID_ADDRESS }));
  });

  it('does not show the status of another business after a change of session', async () => {
    create(OWNER);
    gateway.find.and.resolveTo({
      id: 84,
      businessName: 'Don Pepe',
      ruc: '20123456786',
      address: 'Av. Larco 345',
      verificationStatus: 'VERIFIED',
      lastVerification: null,
    });
    await useCase.profile();
    expect(useCase.verificationStatus()).toBe('VERIFIED');

    TestBed.inject(SessionStore).start({ ...OWNER, businessId: 30 });

    expect(useCase.verificationStatus()).toBeNull();
  });

  it('reads the profile once when the form and the seal ask for it at the same time', async () => {
    create(OWNER);
    gateway.find.and.resolveTo({
      id: 84,
      businessName: 'Don Pepe',
      ruc: '20123456786',
      address: 'Av. Larco 345',
      verificationStatus: 'UNVERIFIED',
      lastVerification: null,
    });

    const [first, second] = await Promise.all([useCase.profile(), useCase.profile()]);
    await useCase.profile();

    expect(gateway.find).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('reads the profile again after a failure, a verification or a change of business', async () => {
    create(OWNER);
    const profile = {
      id: 84,
      businessName: 'Don Pepe',
      ruc: '20123456786',
      address: 'Av. Larco 345',
      verificationStatus: 'UNVERIFIED' as const,
      lastVerification: null,
    };
    gateway.find.and.returnValues(Promise.reject(new Error('caída')), Promise.resolve(profile), Promise.resolve(profile), Promise.resolve(profile));
    gateway.verify.and.resolveTo(VERIFIED);

    await expectAsync(useCase.profile()).toBeRejected();
    await useCase.profile();
    expect(gateway.find).toHaveBeenCalledTimes(2);

    await useCase.verify();
    await useCase.profile();
    expect(gateway.find).toHaveBeenCalledTimes(3);

    TestBed.inject(SessionStore).start({ ...OWNER, businessId: 30 });
    await useCase.profile();
    expect(gateway.find).toHaveBeenCalledTimes(4);
    expect(gateway.find.calls.mostRecent().args).toEqual([30]);
  });

  it('refuses a session without a business', async () => {
    create(null);

    await expectAsync(useCase.profile()).toBeRejectedWith(jasmine.objectContaining({ code: NO_BUSINESS }));
    expect(gateway.find).not.toHaveBeenCalled();
  });
});
