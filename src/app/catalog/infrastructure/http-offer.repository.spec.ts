import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpOfferRepository } from './http-offer.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const ORIGIN = { latitude: -12.1211, longitude: -77.0297 };

describe('HttpOfferRepository', () => {
  let repository: HttpOfferRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpOfferRepository,
      ],
    });
    repository = TestBed.inject(HttpOfferRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks Catalog with the BRD-04 parameters and maps the literal answer of the report', async () => {
    const result = repository.findNearby(ORIGIN, 10, 0);

    const request = http.expectOne((r) => r.url === `${BASE_URL}/offers/nearby`);
    expect(request.request.params.get('lat')).toBe('-12.1211');
    expect(request.request.params.get('lng')).toBe('-77.0297');
    expect(request.request.params.get('radiusMinutes')).toBe('10');
    expect(request.request.params.get('page')).toBe('0');
    expect(request.request.params.get('size')).toBe('20');
    request.flush({
      content: [
        {
          offerId: 1052,
          title: '2x1 en almuerzos ejecutivos',
          businessId: 84,
          businessName: 'Restaurante Don Pepe',
          verifiedSeal: true,
          distanceMeters: 350,
          walkMinutes: 5,
          category: 'Gastronomía',
          price: 15.0,
          validTo: '2026-10-15',
        },
      ],
      page: 0,
      totalElements: 1,
      totalPages: 1,
    });

    const page = await result;
    expect(page.totalElements).toBe(1);
    expect(page.offers[0]).toEqual(
      jasmine.objectContaining({ offerId: 1052, distanceMeters: 350, walkMinutes: 5, verifiedSeal: true }),
    );
  });

  it('returns an empty page for a zone without offers', async () => {
    const result = repository.findNearby(ORIGIN, 5, 0);

    http
      .expectOne((r) => r.url === `${BASE_URL}/offers/nearby`)
      .flush({ content: [], page: 0, totalElements: 0, totalPages: 0 });

    expect((await result).offers).toEqual([]);
  });

  it('rejects with the code Catalog answers', async () => {
    const result = repository.findNearby(ORIGIN, 25, 0);

    http
      .expectOne((r) => r.url === `${BASE_URL}/offers/nearby`)
      .flush(
        { code: 'RADIUS_OUT_OF_RANGE', message: 'El radio debe estar entre 5 y 20 minutos a pie' },
        { status: 400, statusText: 'Bad Request' },
      );

    await expectAsync(result).toBeRejectedWith(
      new ApiError('RADIUS_OUT_OF_RANGE', 'El radio debe estar entre 5 y 20 minutos a pie'),
    );
  });

  it('reads the offer detail of BRD-05 with its location as a point', async () => {
    const result = repository.findById(1052);

    http.expectOne(`${BASE_URL}/offers/1052`).flush({
      offerId: 1052,
      title: '2x1 en almuerzos ejecutivos',
      conditions: 'Válido de lunes a viernes de 12:00 a 15:00. Un cupón por mesa.',
      price: 15.0,
      validTo: '2026-10-15',
      category: 'Gastronomía',
      address: 'Av. Larco 345, Miraflores',
      latitude: -12.1211,
      longitude: -77.0297,
      imageUrl: 'https://images.geops.pe/offers/1052.jpg',
      source: 'AFFILIATED',
      businessId: 84,
      businessName: 'Restaurante Don Pepe',
      verifiedSeal: false,
      available: true,
    });

    const offer = await result;
    expect(offer.location).toEqual({ latitude: -12.1211, longitude: -77.0297 });
    expect(offer.available).toBeTrue();
  });

  it('rejects a missing offer with OFFER_NOT_FOUND', async () => {
    const result = repository.findById(9999);

    http
      .expectOne(`${BASE_URL}/offers/9999`)
      .flush({ code: 'OFFER_NOT_FOUND', message: 'La oferta 9999 no existe.' }, { status: 404, statusText: 'Not Found' });

    await expectAsync(result).toBeRejectedWith(new ApiError('OFFER_NOT_FOUND', 'La oferta 9999 no existe.'));
  });
});
