import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpSavedOfferRepository } from './http-saved-offer.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const SAVED = {
  savedOfferId: 7,
  offerId: 1052,
  businessId: 84,
  businessName: 'Cevichería Mar de Pescadores',
  title: 'Ceviche clásico',
  validTo: '2026-12-08',
  expired: false,
  savedAt: '2026-10-09T15:00:00Z',
};

describe('HttpSavedOfferRepository', () => {
  let repository: HttpSavedOfferRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE_URL }, HttpSavedOfferRepository],
    });
    repository = TestBed.inject(HttpSavedOfferRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the saved offers of the consumer', async () => {
    const result = repository.findMine();
    http.expectOne({ method: 'GET', url: `${BASE_URL}/saved-offers` }).flush([SAVED]);
    expect(await result).toEqual([SAVED]);
  });

  it('saves an offer by its id', async () => {
    const result = repository.save(1052);
    const request = http.expectOne({ method: 'POST', url: `${BASE_URL}/saved-offers` });
    expect(request.request.body).toEqual({ offerId: 1052 });
    request.flush(SAVED, { status: 201, statusText: 'Created' });
    await expectAsync(result).toBeResolved();
  });

  it('removes a saved offer', async () => {
    const result = repository.remove(1052);
    http.expectOne({ method: 'DELETE', url: `${BASE_URL}/saved-offers/1052` }).flush(null, { status: 204, statusText: 'No Content' });
    await expectAsync(result).toBeResolved();
  });

  it('turns the engagement-service error body into an ApiError', async () => {
    const result = repository.save(99);
    http
      .expectOne(`${BASE_URL}/saved-offers`)
      .flush({ code: 'OFFER_NOT_FOUND', message: 'Offer 99 was not found' }, { status: 404, statusText: 'Not Found' });
    await expectAsync(result).toBeRejectedWith(new ApiError('OFFER_NOT_FOUND', 'Offer 99 was not found'));
  });
});
