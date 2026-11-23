import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { EmailConfirmationGateway } from '../domain/ports/email-confirmation.gateway';
import { ConfirmEmailUseCase, INVALID_CONFIRMATION_LINK, MISSING_CONFIRMATION_TOKEN } from './confirm-email.use-case';

describe('ConfirmEmailUseCase', () => {
  let gateway: jasmine.SpyObj<EmailConfirmationGateway>;
  let useCase: ConfirmEmailUseCase;

  beforeEach(() => {
    gateway = jasmine.createSpyObj<EmailConfirmationGateway>('EmailConfirmationGateway', ['confirm']);
    TestBed.configureTestingModule({ providers: [{ provide: EmailConfirmationGateway, useValue: gateway }] });
    useCase = TestBed.inject(ConfirmEmailUseCase);
  });

  it('confirms the e-mail with the token of the link, trimmed', async () => {
    gateway.confirm.and.resolveTo();

    await useCase.execute('  abc123  ');

    expect(gateway.confirm).toHaveBeenCalledWith('abc123');
  });

  it('refuses a link without token and does not call the server', async () => {
    await expectAsync(useCase.execute(null)).toBeRejectedWith(
      jasmine.objectContaining({ code: MISSING_CONFIRMATION_TOKEN }),
    );
    await expectAsync(useCase.execute('   ')).toBeRejectedWith(
      jasmine.objectContaining({ code: MISSING_CONFIRMATION_TOKEN }),
    );
    expect(gateway.confirm).not.toHaveBeenCalled();
  });

  it('passes on the refusal of an invalid or expired link', async () => {
    const refusal = new ApiError(INVALID_CONFIRMATION_LINK, 'El enlace no es válido o ya venció.');
    gateway.confirm.and.rejectWith(refusal);

    await expectAsync(useCase.execute('used')).toBeRejectedWith(refusal);
  });
});
