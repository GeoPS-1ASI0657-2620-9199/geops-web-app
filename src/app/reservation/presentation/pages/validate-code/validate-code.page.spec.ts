import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { Reservation } from '../../../domain/model/reservation';
import { ReservationRepository } from '../../../domain/ports/reservation.repository';
import { ValidateCodePage, rejectionOf } from './validate-code.page';

const RESERVATION: Reservation = {
  reservationId: 15,
  code: 'K7P3XM9Q',
  consumerId: 2001,
  offerId: 1052,
  businessId: 301,
  offerTitle: 'Ceviche clásico',
  status: 'ACTIVE',
  reservedAt: '2026-10-08T13:05:00Z',
  expiresAt: '2099-10-15T04:59:59Z',
  redeemedAt: null,
};

describe('ValidateCodePage', () => {
  let fixture: ComponentFixture<ValidateCodePage>;
  let page: ValidateCodePage;
  let reservations: jasmine.SpyObj<ReservationRepository>;
  type Internals = { code: { set(v: string): void }; rejection(): string | null };

  beforeEach(async () => {
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', ['reserve', 'findById', 'findByCode', 'findMine']);
    await TestBed.configureTestingModule({
      imports: [ValidateCodePage],
      providers: [provideTranslateService(), { provide: ReservationRepository, useValue: reservations }],
    }).compileComponents();
    fixture = TestBed.createComponent(ValidateCodePage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  const validate = async (typed: string) => {
    (page as unknown as Internals).code.set(typed);
    await page.validate();
    fixture.detectChanges();
  };
  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const rejection = () => (page as unknown as Internals).rejection();

  it('normalizes what the owner types and shows a valid code to charge (US41, Figma 34)', async () => {
    reservations.findByCode.and.resolveTo(RESERVATION);

    await validate(' k7p3-xm9q ');

    expect(reservations.findByCode).toHaveBeenCalledWith('K7P3XM9Q');
    expect(text()).toContain('validatePage.valid');
    expect(text()).toContain('Ceviche clásico');
  });

  it('rejects a malformed code without calling the service', async () => {
    await validate('0OIL');

    expect(reservations.findByCode).not.toHaveBeenCalled();
    expect(rejection()).toBe('MALFORMED');
  });

  it('explains each reason a code cannot be charged (Figma 35)', async () => {
    reservations.findByCode.and.resolveTo({ ...RESERVATION, status: 'REDEEMED', redeemedAt: '2026-10-09T17:48:00Z' });
    await validate('K7P3XM9Q');
    expect(rejection()).toBe('REDEEMED');

    reservations.findByCode.and.rejectWith(new ApiError('RESERVATION_NOT_FOUND', 'no'));
    await validate('K7P3XM9Q');
    expect(rejection()).toBe('NOT_FOUND');

    reservations.findByCode.and.rejectWith(new ApiError('FORBIDDEN', 'no'));
    await validate('K7P3XM9Q');
    expect(rejection()).toBe('OTHER_BUSINESS');

    reservations.findByCode.and.rejectWith(new ApiError(NETWORK_ERROR, 'no'));
    await validate('K7P3XM9Q');
    expect(rejection()).toBe('NETWORK');
  });

  it('clears the result to validate another code', async () => {
    reservations.findByCode.and.resolveTo(RESERVATION);
    await validate('K7P3XM9Q');

    page.clear();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).querySelector('.result')).toBeNull();
  });

  it('rejectionOf maps every status', () => {
    expect(rejectionOf(RESERVATION)).toBeNull();
    expect(rejectionOf({ ...RESERVATION, status: 'EXPIRED' })).toBe('EXPIRED');
    expect(rejectionOf({ ...RESERVATION, status: 'REPORTED' })).toBe('REPORTED');
  });
});
