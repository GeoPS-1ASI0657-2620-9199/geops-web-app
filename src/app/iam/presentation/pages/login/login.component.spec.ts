import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { LogInUseCase } from '../../../application/log-in.use-case';
import { PendingBaseline } from '../../../../catalog/application/pending-baseline';
import { Session } from '../../../domain/model/session';
import { LoginComponent, RegisteredState } from './login.component';

const session = (role: Session['role']): Session => ({
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 1,
  role,
  email: 'rosa@ejemplo.pe',
});

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let useCase: jasmine.SpyObj<LogInUseCase>;
  let router: Router;
  let pendingBaseline: jasmine.SpyObj<PendingBaseline>;

  const create = async (query: Record<string, string> = {}, state: RegisteredState | null = null) => {
    useCase = jasmine.createSpyObj<LogInUseCase>('LogInUseCase', ['execute']);
    pendingBaseline = jasmine.createSpyObj<PendingBaseline>('PendingBaseline', ['hold', 'declareFor']);
    pendingBaseline.declareFor.and.resolveTo(null);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: LogInUseCase, useValue: useCase },
        { provide: PendingBaseline, useValue: pendingBaseline },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue(
      state ? ({ extras: { state } } as unknown as ReturnType<Router['getCurrentNavigation']>) : null,
    );
    fixture = TestBed.createComponent(LoginComponent);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture.detectChanges();
  };
  const fill = () =>
    (fixture.componentInstance as unknown as { form: { setValue(v: object): void } }).form.setValue({
      email: 'rosa@ejemplo.pe',
      password: 'Bodega#2026',
    });
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  it('sends a business owner to the campaign panel (US23)', async () => {
    await create();
    useCase.execute.and.resolveTo(session('BUSINESS_OWNER'));
    fill();

    await fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/business');
  });

  it('declares the baseline typed at registration once the owner has a session (US45)', async () => {
    await create({ registered: '1' });
    useCase.execute.and.resolveTo(session('BUSINESS_OWNER'));
    pendingBaseline.declareFor.and.resolveTo(true);
    fill();

    await fixture.componentInstance.submit();

    expect(pendingBaseline.declareFor).toHaveBeenCalledOnceWith('rosa@ejemplo.pe');
    expect(useCase.execute).toHaveBeenCalledBefore(pendingBaseline.declareFor);
  });

  it('still enters the panel when the baseline cannot be saved (US45)', async () => {
    await create({ registered: '1' });
    useCase.execute.and.resolveTo(session('BUSINESS_OWNER'));
    pendingBaseline.declareFor.and.resolveTo(false);
    fill();

    await fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/business');
  });

  it('does not touch the baseline when the credentials are wrong', async () => {
    await create();
    useCase.execute.and.rejectWith(new ApiError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'));
    fill();

    await fixture.componentInstance.submit();

    expect(pendingBaseline.declareFor).not.toHaveBeenCalled();
  });

  it('sends a consumer to the nearby offers (US21)', async () => {
    await create();
    useCase.execute.and.resolveTo(session('CONSUMER'));
    fill();

    await fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
  });

  it('goes back to the page that asked for login', async () => {
    await create({ returnUrl: '/campaigns/new' });
    useCase.execute.and.resolveTo(session('BUSINESS_OWNER'));
    fill();

    await fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/campaigns/new');
  });

  it('rejects wrong credentials without saying which one failed', async () => {
    await create();
    useCase.execute.and.rejectWith(new ApiError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'));
    fill();

    await fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(text()).toContain('loginPage.errors.credentials.title');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('lets the user retry after fixing only the password', async () => {
    await create();
    useCase.execute.and.rejectWith(new ApiError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'));
    fill();
    await fixture.componentInstance.submit();

    const form = (fixture.componentInstance as unknown as { form: { controls: { password: { setValue(v: string): void } }; valid: boolean } }).form;
    form.controls.password.setValue('Bodega#2027');

    expect(form.valid).toBeTrue();
  });

  it('confirms the new account after registration', async () => {
    await create({ registered: '1' });

    expect(text()).toContain('loginPage.registered.title');
  });

  it('tells a new consumer that the confirmation e-mail was sent and fills in the address', async () => {
    await create({ registered: '1' }, { registeredEmail: 'ariana@correo.pe', registeredRole: 'CONSUMER' });

    expect(text()).toContain('loginPage.registered.confirmationSent');
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe('ariana@correo.pe');
  });

  it('fills in the address of a new business owner without mentioning the confirmation e-mail', async () => {
    await create({ registered: '1' }, { registeredEmail: 'rosa@ejemplo.pe', registeredRole: 'BUSINESS_OWNER' });

    expect(text()).toContain('loginPage.registered.description');
    expect(text()).not.toContain('loginPage.registered.confirmationSent');
    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe('rosa@ejemplo.pe');
  });

  it('leaves the address empty when the navigation brings none', async () => {
    await create({ registered: '1' });

    expect((fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('input[type="email"]')?.value).toBe('');
  });
});
