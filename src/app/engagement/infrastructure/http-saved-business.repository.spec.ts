import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { HttpSavedBusinessRepository } from './http-saved-business.repository';

const BASE_URL = 'http://gateway.test/api/v1';

describe('HttpSavedBusinessRepository', () => {
  let repository: HttpSavedBusinessRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: API_BASE_URL, useValue: BASE_URL }, HttpSavedBusinessRepository],
    });
    repository = TestBed.inject(HttpSavedBusinessRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('keeps the offers Engagement lists under each saved business', async () => {
    const result = repository.findMine();
    const offers = [{ offerId: 1070, title: 'Menu del dia', validTo: '2026-11-30' }];
    http.expectOne(`${BASE_URL}/saved-businesses`).flush([
      { id: 1, businessId: 85, businessName: 'Bodega Rosa', savedAt: '2026-11-20T10:00:00Z', activeOffersCount: 1, activeOffers: offers },
    ]);

    expect((await result)[0].activeOffers).toEqual(offers);
  });

  it('reads a saved business without offers as one with none, for an Engagement that does not send them yet', async () => {
    const result = repository.findMine();
    http.expectOne(`${BASE_URL}/saved-businesses`).flush([
      { id: 1, businessId: 85, businessName: 'Bodega Rosa', savedAt: '2026-11-20T10:00:00Z' },
    ]);

    const [business] = await result;
    expect(business.activeOffers).toEqual([]);
    expect(business.activeOffersCount).toBe(0);
  });
});
