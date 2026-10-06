import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { Reservation } from '../domain/model/reservation';
import { ReservationRepository } from '../domain/ports/reservation.repository';
import { GetReservationUseCase, RESERVATION_NOT_FOUND } from './get-reservation.use-case';
import { ListMyReservationsUseCase } from './list-my-reservations.use-case';
import { INVALID_REQUEST, ReserveOfferUseCase } from './reserve-offer.use-case';

const RESERVATION: Reservation = {
  reservationId: 15,
  code: 'K7P3XM9Q',
  consumerId: 2001,
  offerId: 1052,
  businessId: 301,
  offerTitle: 'Menú ejecutivo a mitad de precio',
  status: 'ACTIVE',
  reservedAt: '2026-10-08T13:05:00Z',
  expiresAt: '2026-10-15T04:59:59Z',
  redeemedAt: null,
};

describe('Reservation use cases', () => {
  let reservations: jasmine.SpyObj<ReservationRepository>;

  beforeEach(() => {
    reservations = jasmine.createSpyObj<ReservationRepository>('ReservationRepository', [
      'reserve',
      'findById',
      'findMine',
    ]);
    TestBed.configureTestingModule({ providers: [{ provide: ReservationRepository, useValue: reservations }] });
  });

  describe('ReserveOfferUseCase', () => {
    it('reserves the offer and returns the code', async () => {
      reservations.reserve.and.resolveTo({
        reservationId: 15,
        code: 'K7P3XM9Q',
        expiresAt: '2026-10-15T04:59:59Z',
        isNew: true,
      });

      const placed = await TestBed.inject(ReserveOfferUseCase).execute(1052);

      expect(reservations.reserve).toHaveBeenCalledWith(1052);
      expect(placed.code).toBe('K7P3XM9Q');
    });

    it('does not call the service with an invalid offer id', async () => {
      await expectAsync(TestBed.inject(ReserveOfferUseCase).execute(0)).toBeRejectedWith(
        jasmine.objectContaining<ApiError>({ code: INVALID_REQUEST }),
      );
      expect(reservations.reserve).not.toHaveBeenCalled();
    });

    it('passes on the conflict of an offer that is no longer valid', async () => {
      reservations.reserve.and.rejectWith(new ApiError('OFFER_NOT_AVAILABLE', 'Offer 1053 is no longer valid'));

      await expectAsync(TestBed.inject(ReserveOfferUseCase).execute(1053)).toBeRejectedWith(
        jasmine.objectContaining<ApiError>({ code: 'OFFER_NOT_AVAILABLE' }),
      );
    });
  });

  describe('GetReservationUseCase', () => {
    it('reads the reservation by id', async () => {
      reservations.findById.and.resolveTo(RESERVATION);

      expect(await TestBed.inject(GetReservationUseCase).execute(15)).toBe(RESERVATION);
    });

    it('answers RESERVATION_NOT_FOUND for an id that cannot exist', async () => {
      await expectAsync(TestBed.inject(GetReservationUseCase).execute(Number('abc'))).toBeRejectedWith(
        jasmine.objectContaining<ApiError>({ code: RESERVATION_NOT_FOUND }),
      );
      expect(reservations.findById).not.toHaveBeenCalled();
    });
  });

  describe('ListMyReservationsUseCase', () => {
    it('lists every status by default', async () => {
      reservations.findMine.and.resolveTo([RESERVATION]);

      expect(await TestBed.inject(ListMyReservationsUseCase).execute()).toEqual([RESERVATION]);
      expect(reservations.findMine).toHaveBeenCalledWith(null);
    });

    it('filters by the chosen status', async () => {
      reservations.findMine.and.resolveTo([]);

      await TestBed.inject(ListMyReservationsUseCase).execute('REDEEMED');

      expect(reservations.findMine).toHaveBeenCalledWith('REDEEMED');
    });
  });
});
