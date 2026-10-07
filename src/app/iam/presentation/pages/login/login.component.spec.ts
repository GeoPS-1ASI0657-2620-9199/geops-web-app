import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { LogInUseCase } from '../../../application/log-in.use-case';
import { Session } from '../../../domain/model/session';
import { LoginComponent } from './login.component';

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

  const create = async (query: Record<string, string> = {}) => {
    useCase = jasmine.createSpyObj<LogInUseCase>('LogInUseCase', ['execute']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: LogInUseCase, useValue: useCase },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    router = TestBed.inject(Router);
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

    expect(router.navigateByUrl).toHaveBeenCalledWith('/campaigns');
  });

  it('sends a consumer to the nearby offers (US21)', async () => {
    await create();
    useCase.execute.and.resolveTo(session('CONSUMER'));
    fill();

    await fixture.componentInstance.submit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/offers');
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
});
