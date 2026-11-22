import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { PendingBaseline } from '../../../../catalog/application/pending-baseline';
import { RegisterBusinessUseCase } from '../../../application/register-business.use-case';
import { RegisterBusinessComponent } from './register-business.component';

interface Wizard {
  step(): number;
  business: { setValue(v: object): void; controls: Record<string, { hasError(e: string): boolean }> };
  place: { setValue(v: object): void; controls: Record<string, { hasError(e: string): boolean }> };
  baseline: {
    setValue(v: object): void;
    invalid: boolean;
    controls: Record<string, { hasError(e: string): boolean }>;
  };
}

describe('RegisterBusinessComponent', () => {
  let fixture: ComponentFixture<RegisterBusinessComponent>;
  let component: RegisterBusinessComponent;
  let wizard: Wizard;
  let useCase: jasmine.SpyObj<RegisterBusinessUseCase>;
  let router: Router;
  let pendingBaseline: jasmine.SpyObj<PendingBaseline>;

  const account = (ruc = '10456789019') =>
    wizard.business.setValue({
      businessName: 'Bodega Doña Rosa',
      businessType: 'Bodega',
      ruc,
      fullName: 'Rosa Quispe Mamani',
      phone: '987654321',
      email: 'rosa.quispe@ejemplo.pe',
      password: 'Bodega#2026',
    });
  const place = () => wizard.place.setValue({ address: 'Jr. Huánuco 1250, La Victoria', openingHours: '' });
  const baseline = (customersPerWeek: number | null, averageTicket: number | null) =>
    wizard.baseline.setValue({ customersPerWeek, averageTicket });
  const toLastStep = () => {
    account();
    component.continue();
    component.onPointSelected({ latitude: -12.0681, longitude: -77.035 });
    place();
  };
  const registered = () =>
    useCase.execute.and.resolveTo({ userId: 42, fullName: 'Rosa', email: 'rosa.quispe@ejemplo.pe', role: 'BUSINESS_OWNER' });

  beforeEach(async () => {
    useCase = jasmine.createSpyObj<RegisterBusinessUseCase>('RegisterBusinessUseCase', ['execute']);
    pendingBaseline = jasmine.createSpyObj<PendingBaseline>('PendingBaseline', ['hold', 'declareFor']);
    await TestBed.configureTestingModule({
      imports: [RegisterBusinessComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: RegisterBusinessUseCase, useValue: useCase },
        { provide: PendingBaseline, useValue: pendingBaseline },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterBusinessComponent);
    component = fixture.componentInstance;
    wizard = component as unknown as Wizard;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('stays on the first step while the RUC does not have 11 digits', () => {
    account('1045678');

    component.continue();

    expect(wizard.step()).toBe(0);
  });

  it('sends one request with the marked point and goes to login', async () => {
    account();
    component.continue();
    component.onPointSelected({ latitude: -12.0681, longitude: -77.035 });
    place();
    useCase.execute.and.resolveTo({ userId: 42, fullName: 'Rosa', email: 'rosa.quispe@ejemplo.pe', role: 'BUSINESS_OWNER' });

    await component.submit();

    expect(useCase.execute).toHaveBeenCalledTimes(1);
    expect(useCase.execute.calls.mostRecent().args[0].business.location).toEqual({ latitude: -12.0681, longitude: -77.035 });
    expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { registered: 1 } });
  });

  describe('Tu situación actual (US45)', () => {
    it('is optional: an empty section registers the business and holds no baseline', async () => {
      toLastStep();
      registered();

      await component.submit();

      expect(wizard.baseline.invalid).toBeFalse();
      expect(useCase.execute).toHaveBeenCalledTimes(1);
      expect(pendingBaseline.hold).not.toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { registered: 1 } });
    });

    it('rejects customers that are not a whole number between 1 and 100 000', () => {
      for (const customers of [0, -3, 12.5, 100_001]) {
        baseline(customers, 18.5);
        expect(wizard.baseline.controls['customersPerWeek'].hasError('customers')).withContext(String(customers)).toBeTrue();
      }
      baseline(100_000, 18.5);
      expect(wizard.baseline.invalid).toBeFalse();
    });

    it('rejects a ticket of zero, above the limit or with more than two decimals', () => {
      for (const ticket of [0, -1, 100_000, 18.555]) {
        baseline(120, ticket);
        expect(wizard.baseline.controls['averageTicket'].hasError('ticket')).withContext(String(ticket)).toBeTrue();
      }
      baseline(120, 18.55);
      expect(wizard.baseline.invalid).toBeFalse();
    });

    it('asks for both values when only one is filled and does not register', async () => {
      toLastStep();
      baseline(120, null);

      await component.submit();

      expect(wizard.baseline.controls['averageTicket'].hasError('pair')).toBeTrue();
      expect(useCase.execute).not.toHaveBeenCalled();
    });

    it('holds the baseline for the first login of the new owner when both are filled', async () => {
      toLastStep();
      baseline(120, 18.5);
      registered();

      await component.submit();

      expect(pendingBaseline.hold).toHaveBeenCalledOnceWith('rosa.quispe@ejemplo.pe', 120, 18.5);
      expect(router.navigate).toHaveBeenCalledWith(['/login'], { queryParams: { registered: 1 } });
    });

    it('holds nothing when the registration fails', async () => {
      toLastStep();
      baseline(120, 18.5);
      useCase.execute.and.rejectWith(new ApiError('EMAIL_ALREADY_REGISTERED', 'Ese correo ya tiene cuenta.'));

      await component.submit();

      expect(pendingBaseline.hold).not.toHaveBeenCalled();
    });
  });

  it('goes back to the first step and marks the RUC already registered', async () => {
    account();
    component.continue();
    component.onPointSelected({ latitude: -12.0681, longitude: -77.035 });
    place();
    useCase.execute.and.rejectWith(new ApiError('RUC_ALREADY_REGISTERED', 'Ese RUC ya tiene un negocio registrado.'));

    await component.submit();

    fixture.detectChanges();

    expect(wizard.step()).toBe(0);
    expect(wizard.business.controls['ruc'].hasError('server')).toBeTrue();
  });

  it('forgets the server error once the owner edits the field', async () => {
    account();
    component.continue();
    component.onPointSelected({ latitude: -12.0681, longitude: -77.035 });
    place();
    useCase.execute.and.rejectWith(new ApiError('RUC_ALREADY_REGISTERED', 'Ese RUC ya tiene un negocio registrado.'));
    await component.submit();
    fixture.detectChanges();

    account('20601234567');

    expect(wizard.business.controls['ruc'].hasError('server')).toBeFalse();
  });

  it('asks to correct the address when Identity rejects the location (CA-22.2)', async () => {
    account();
    component.continue();
    component.onPointSelected({ latitude: -12.0681, longitude: -77.035 });
    place();
    useCase.execute.and.rejectWith(
      new ApiError('INVALID_LOCATION', 'La latitud debe estar entre -90 y 90. Corrige la ubicación del local.'),
    );

    await component.submit();
    fixture.detectChanges();

    expect(wizard.step()).toBe(1);
    expect(wizard.place.controls['address'].hasError('server')).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Corrige la ubicación del local.');
  });
});
