import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import {
  ConfirmEmailUseCase,
  INVALID_CONFIRMATION_LINK,
  MISSING_CONFIRMATION_TOKEN,
} from '../../../application/confirm-email.use-case';
import { Session } from '../../../domain/model/session';
import { SessionStorage } from '../../../domain/ports/session.storage';
import { ConfirmEmailPage } from './confirm-email.page';

const CONSUMER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 7,
  role: 'CONSUMER',
  email: 'ariana@correo.pe',
};

describe('ConfirmEmailPage', () => {
  let fixture: ComponentFixture<ConfirmEmailPage>;
  let useCase: jasmine.SpyObj<ConfirmEmailUseCase>;

  const create = async (query: Record<string, string>, session: Session | null = null) => {
    await TestBed.configureTestingModule({
      imports: [ConfirmEmailPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: ConfirmEmailUseCase, useValue: useCase },
        { provide: SessionStorage, useValue: { read: () => session, write: () => undefined, clear: () => undefined } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmEmailPage);
    fixture.detectChanges();
  };
  const host = () => fixture.nativeElement as HTMLElement;
  const heading = () => host().querySelector('h1')?.textContent ?? '';
  const settle = async () => {
    await fixture.whenStable();
    fixture.detectChanges();
  };

  beforeEach(() => {
    useCase = jasmine.createSpyObj<ConfirmEmailUseCase>('ConfirmEmailUseCase', ['execute']);
  });

  it('shows the confirming state with its h1 while the server answers', async () => {
    useCase.execute.and.returnValue(new Promise(() => undefined));
    await create({ token: 'abc123' });

    expect(useCase.execute).toHaveBeenCalledWith('abc123');
    expect(host().querySelector('geo-top-bar .logo')?.textContent?.trim()).toBe('GeoPS');
    expect(heading()).toContain('confirmEmailPage.confirming.title');
    expect(host().querySelector('mat-progress-spinner')).not.toBeNull();
  });

  it('confirms the e-mail and offers to log in to a visitor without session', async () => {
    useCase.execute.and.resolveTo();
    await create({ token: 'abc123' });
    await settle();

    expect(heading()).toContain('confirmEmailPage.confirmed.title');
    const action = host().querySelector<HTMLAnchorElement>('a.primary');
    expect(action?.textContent).toContain('confirmEmailPage.logIn');
    expect(action?.getAttribute('href')).toBe('/login');
  });

  it('sends a user already in session to the home of the role', async () => {
    useCase.execute.and.resolveTo();
    await create({ token: 'abc123' }, CONSUMER);
    await settle();

    const action = host().querySelector<HTMLAnchorElement>('a.primary');
    expect(action?.textContent).toContain('confirmEmailPage.goHome');
    expect(action?.getAttribute('href')).toBe('/inicio');
  });

  it('explains an invalid or expired link and that e-mail notices stay off', async () => {
    useCase.execute.and.rejectWith(new ApiError(INVALID_CONFIRMATION_LINK, 'El enlace no es válido o ya venció.'));
    await create({ token: 'used' });
    await settle();

    expect(heading()).toContain('confirmEmailPage.invalid.title');
    expect(host().querySelector('geo-alert')?.textContent).toContain('confirmEmailPage.channelOff.title');
    expect(host().querySelector('a.primary')?.getAttribute('href')).toBe('/login');
  });

  it('explains a link without token', async () => {
    useCase.execute.and.rejectWith(new ApiError(MISSING_CONFIRMATION_TOKEN, MISSING_CONFIRMATION_TOKEN));
    await create({});
    await settle();

    expect(useCase.execute).toHaveBeenCalledWith(null);
    expect(heading()).toContain('confirmEmailPage.missing.title');
    expect(host().querySelector('geo-alert')?.textContent).toContain('confirmEmailPage.channelOff.title');
  });

  it('lets the user retry when the server could not be reached', async () => {
    useCase.execute.and.rejectWith(new ApiError(NETWORK_ERROR, 'No se pudo conectar con el servidor.'));
    await create({ token: 'abc123' });
    await settle();

    expect(heading()).toContain('confirmEmailPage.failed.title');
    expect(host().textContent).toContain('No se pudo conectar con el servidor.');

    useCase.execute.and.resolveTo();
    host().querySelector<HTMLButtonElement>('button.primary')?.click();
    await settle();

    expect(useCase.execute).toHaveBeenCalledTimes(2);
    expect(heading()).toContain('confirmEmailPage.confirmed.title');
  });
});
