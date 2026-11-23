import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { DeclareBaselineUseCase } from './declare-baseline.use-case';
import { PendingBaseline } from './pending-baseline';

describe('PendingBaseline', () => {
  let pending: PendingBaseline;
  let declareBaseline: jasmine.SpyObj<DeclareBaselineUseCase>;

  beforeEach(() => {
    declareBaseline = jasmine.createSpyObj<DeclareBaselineUseCase>('DeclareBaselineUseCase', ['execute']);
    TestBed.configureTestingModule({ providers: [{ provide: DeclareBaselineUseCase, useValue: declareBaseline }] });
    pending = TestBed.inject(PendingBaseline);
  });

  it('declares the baseline held at registration when that owner logs in (US45)', async () => {
    declareBaseline.execute.and.resolveTo({ customersPerWeek: 120, averageTicket: 18.5, declaredAt: '2026-11-22T10:00:00Z' });
    pending.hold('rosa@ejemplo.pe', 120, 18.5);

    expect(await pending.declareFor('rosa@ejemplo.pe')).toBeTrue();
    expect(declareBaseline.execute).toHaveBeenCalledOnceWith(120, 18.5);
  });

  it('declares it only once', async () => {
    declareBaseline.execute.and.resolveTo({ customersPerWeek: 120, averageTicket: 18.5, declaredAt: '2026-11-22T10:00:00Z' });
    pending.hold('rosa@ejemplo.pe', 120, 18.5);
    await pending.declareFor('rosa@ejemplo.pe');

    expect(await pending.declareFor('rosa@ejemplo.pe')).toBeNull();
    expect(declareBaseline.execute).toHaveBeenCalledTimes(1);
  });

  it('does nothing when nothing was held or another account logs in', async () => {
    expect(await pending.declareFor('rosa@ejemplo.pe')).toBeNull();

    pending.hold('rosa@ejemplo.pe', 120, 18.5);

    expect(await pending.declareFor('otro@ejemplo.pe')).toBeNull();
    expect(declareBaseline.execute).not.toHaveBeenCalled();
  });

  it('swallows a failed save so the login goes on; Métricas keeps asking for it', async () => {
    declareBaseline.execute.and.rejectWith(new ApiError('SERVICE_UNAVAILABLE', 'Catálogo no responde.'));
    pending.hold('rosa@ejemplo.pe', 120, 18.5);

    expect(await pending.declareFor('rosa@ejemplo.pe')).toBeFalse();
  });
});
