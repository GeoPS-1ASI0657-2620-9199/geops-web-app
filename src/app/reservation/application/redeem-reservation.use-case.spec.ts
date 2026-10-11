import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { ReservationRepository } from '../domain/ports/reservation.repository';
import { MALFORMED_CODE } from './find-reservation-by-code.use-case';
import { RedeemReservationUseCase } from './redeem-reservation.use-case';

const REDEEMED_AT = '2026-10-20T17:42:10Z';

describe('RedeemReservationUseCase', () => {
  let reservations: jasmine.SpyObj<ReservationRepository>;
  let useCase: RedeemReservationUseCase;

  beforeEach(() => {
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', ['redeem']);
    TestBed.configureTestingModule({ providers: [{ provide: ReservationRepository, useValue: reservations }] });
    useCase = TestBed.inject(RedeemReservationUseCase);
  });

  it('normalizes the code and records the delivery (US41)', async () => {
    reservations.redeem.and.resolveTo({ reservationId: 15, code: 'K7P3XM9Q', offerId: 1052, offerTitle: 'Menú', redeemedAt: REDEEMED_AT });

    expect(await useCase.execute(' k7p3-xm9q ')).toEqual({ code: 'K7P3XM9Q', redeemedAt: REDEEMED_AT });
    expect(reservations.redeem).toHaveBeenCalledWith('K7P3XM9Q');
  });

  it('takes the 409 with its date as the delivery already recorded by this business', async () => {
    reservations.redeem.and.rejectWith(new ApiError('RESERVATION_ALREADY_REDEEMED', 'ya', REDEEMED_AT));

    expect(await useCase.execute('K7P3XM9Q')).toEqual({ code: 'K7P3XM9Q', redeemedAt: REDEEMED_AT });
  });

  it('passes on every other rejection', async () => {
    reservations.redeem.and.rejectWith(new ApiError('RESERVATION_EXPIRED', 'vencida'));

    await expectAsync(useCase.execute('K7P3XM9Q')).toBeRejectedWith(jasmine.objectContaining({ code: 'RESERVATION_EXPIRED' }));
  });

  it('does not call the service with a malformed code', async () => {
    await expectAsync(useCase.execute('0OIL')).toBeRejectedWith(jasmine.objectContaining({ code: MALFORMED_CODE }));
    expect(reservations.redeem).not.toHaveBeenCalled();
  });
});
