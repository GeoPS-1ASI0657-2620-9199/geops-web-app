import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpReservationRepository } from './http-reservation.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const RESERVATIONS_URL = `${BASE_URL}/reservations`;
const CREATED = { reservationId: 15, code: 'K7P3XM9Q', expiresAt: '2026-10-15T04:59:59Z' };
const RESERVATION = {
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

describe('HttpReservationRepository', () => {
  let repository: HttpReservationRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpReservationRepository,
      ],
    });
    repository = TestBed.inject(HttpReservationRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts only the offer id and marks a 201 as a new reservation', async () => {
    const result = repository.reserve(1052);

    const request = http.expectOne(RESERVATIONS_URL);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ offerId: 1052 });
    request.flush(CREATED, { status: 201, statusText: 'Created' });

    expect(await result).toEqual({ ...CREATED, isNew: true });
  });

  it('marks a 200 as the active reservation the consumer already had', async () => {
    const result = repository.reserve(1052);

    http.expectOne(RESERVATIONS_URL).flush(CREATED, { status: 200, statusText: 'OK' });

    expect((await result).isNew).toBeFalse();
  });

  it('rejects an expired offer with OFFER_NOT_AVAILABLE', async () => {
    const result = repository.reserve(1053);

    http
      .expectOne(RESERVATIONS_URL)
      .flush(
        { code: 'OFFER_NOT_AVAILABLE', message: 'Offer 1053 is no longer valid' },
        { status: 409, statusText: 'Conflict' },
      );

    await expectAsync(result).toBeRejectedWith(
      new ApiError('OFFER_NOT_AVAILABLE', 'Offer 1053 is no longer valid'),
    );
  });

  it('rejects with CATALOG_UNAVAILABLE when Catalog does not answer', async () => {
    const result = repository.reserve(1052);

    http
      .expectOne(RESERVATIONS_URL)
      .flush(
        { code: 'CATALOG_UNAVAILABLE', message: 'Catalog is not available' },
        { status: 503, statusText: 'Service Unavailable' },
      );

    await expectAsync(result).toBeRejectedWith(
      jasmine.objectContaining<ApiError>({ code: 'CATALOG_UNAVAILABLE' }),
    );
  });

  it('looks a code up for the business owner (US41)', async () => {
    const result = repository.findByCode('K7P3XM9Q');

    http.expectOne(`${RESERVATIONS_URL}/code/K7P3XM9Q`).flush(RESERVATION);

    expect(await result).toEqual(jasmine.objectContaining({ code: 'K7P3XM9Q', status: 'ACTIVE' }));
  });

  it('reads one reservation with its offer and status', async () => {
    const result = repository.findById(15);

    http.expectOne(`${RESERVATIONS_URL}/15`).flush(RESERVATION);

    expect(await result).toEqual(
      jasmine.objectContaining({ code: 'K7P3XM9Q', offerTitle: 'Menú ejecutivo a mitad de precio', status: 'ACTIVE' }),
    );
  });

  it('rejects a reservation of another consumer with FORBIDDEN', async () => {
    const result = repository.findById(15);

    http
      .expectOne(`${RESERVATIONS_URL}/15`)
      .flush(
        { code: 'FORBIDDEN', message: 'Reservation 15 belongs to another account' },
        { status: 403, statusText: 'Forbidden' },
      );

    await expectAsync(result).toBeRejectedWith(jasmine.objectContaining<ApiError>({ code: 'FORBIDDEN' }));
  });

  it('lists every reservation without a status parameter', async () => {
    const result = repository.findMine(null);

    const request = http.expectOne((r) => r.url === RESERVATIONS_URL);
    expect(request.request.params.has('status')).toBeFalse();
    request.flush([RESERVATION]);

    expect((await result).length).toBe(1);
  });

  it('sends the status filter the service understands', async () => {
    const result = repository.findMine('EXPIRED');

    const request = http.expectOne((r) => r.url === RESERVATIONS_URL);
    expect(request.request.params.get('status')).toBe('EXPIRED');
    request.flush([]);

    expect(await result).toEqual([]);
  });
});
