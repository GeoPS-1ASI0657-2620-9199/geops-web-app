import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { RegisterConsumerUseCase } from '../../../application/register-consumer.use-case';
import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let useCase: jasmine.SpyObj<RegisterConsumerUseCase>;
  let router: Router;

  const fill = (overrides: Partial<Record<string, string>> = {}) => {
    const values = {
      givenNames: 'Ariana',
      surnames: 'Torres',
      email: 'ariana@correo.pe',
      phone: '987654321',
      password: 'Ofertas#2026',
      ...overrides,
    };
    const component = fixture.componentInstance as unknown as {
      form: { setValue(v: typeof values): void };
    };
    component.form.setValue(values);
  };
  const submit = () => fixture.componentInstance.submit();
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';

  beforeEach(async () => {
    useCase = jasmine.createSpyObj<RegisterConsumerUseCase>('RegisterConsumerUseCase', ['execute']);
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: RegisterConsumerUseCase, useValue: useCase },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('does not call Identity while the phone does not have 9 digits starting with 9', async () => {
    fill({ phone: '12345' });

    await submit();

    expect(useCase.execute).not.toHaveBeenCalled();
  });

  it('goes to the login page after creating the account', async () => {
    useCase.execute.and.resolveTo({
      userId: 1,
      fullName: 'Ariana Torres',
      email: 'ariana@correo.pe',
      role: 'CONSUMER',
    });
    fill();

    await submit();

    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { registered: 1 } });
  });

  it('marks the email and shows the alert when it is already registered', async () => {
    useCase.execute.and.rejectWith(new ApiError('EMAIL_ALREADY_REGISTERED', 'Ese correo ya tiene una cuenta.'));
    fill();

    await submit();
    fixture.detectChanges();

    expect(text()).toContain('registerPage.errors.emailTaken.title');
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('shows the server message when Identity rejects the data', async () => {
    useCase.execute.and.rejectWith(new ApiError('INVALID_REQUEST', 'Revisa estos datos: phone.'));
    fill();

    await submit();
    fixture.detectChanges();

    expect(text()).toContain('Revisa estos datos: phone.');
  });
});
