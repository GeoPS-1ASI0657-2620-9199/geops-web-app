import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpModerationRepository } from './http-moderation.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const OFFER = {
  offerId: 1052,
  title: '2x1 en almuerzos ejecutivos',
  category: 'Gastronomía',
  source: 'AFFILIATED',
  businessId: 84,
  businessName: 'Restaurante Don Pepe',
  status: 'PUBLISHED',
  validTo: '2026-11-30',
  openReports: 2,
  verifiedSeal: false,
};

describe('HttpModerationRepository', () => {
  let repository: HttpModerationRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpModerationRepository,
      ],
    });
    repository = TestBed.inject(HttpModerationRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for every offer when no filter is set', async () => {
    const result = repository.findOffers({ status: null, reportedOnly: false, text: '  ' }, 0, 20);

    const request = http.expectOne((r) => r.url === `${BASE_URL}/admin/offers`);
    expect(request.request.params.keys().sort()).toEqual(['page', 'size']);
    request.flush({ content: [OFFER], page: 0, totalElements: 1, totalPages: 1 });

    const page = await result;
    expect(page.items[0].title).toBe('2x1 en almuerzos ejecutivos');
    expect(page.totalElements).toBe(1);
  });

  it('sends the status, the reported filter and the text of the panel', async () => {
    const result = repository.findOffers({ status: 'REMOVED', reportedOnly: true, text: ' almuerzo ' }, 2, 20);

    const request = http.expectOne((r) => r.url === `${BASE_URL}/admin/offers`);
    expect(request.request.params.get('status')).toBe('REMOVED');
    expect(request.request.params.get('reported')).toBe('true');
    expect(request.request.params.get('q')).toBe('almuerzo');
    expect(request.request.params.get('page')).toBe('2');
    request.flush({ content: [], page: 2, totalElements: 0, totalPages: 0 });

    expect((await result).items).toEqual([]);
  });

  it('removes the offer with the reason in the body of the DELETE (US24)', async () => {
    const result = repository.remove(1052, '  La oferta anuncia un precio que el local no respeta.  ');

    const request = http.expectOne(`${BASE_URL}/admin/offers/1052`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toEqual({ reason: 'La oferta anuncia un precio que el local no respeta.' });
    request.flush({
      moderationId: 31,
      offerId: 1052,
      offerStatus: 'REMOVED',
      adminId: 1,
      reason: 'La oferta anuncia un precio que el local no respeta.',
      removedAt: '2026-11-22T15:04:05Z',
    });

    expect((await result).moderationId).toBe(31);
  });

  it('turns the 409 of an offer already removed into an ApiError', async () => {
    const result = repository.remove(1052, 'Imagen tomada de otro comercio');

    http.expectOne(`${BASE_URL}/admin/offers/1052`).flush(
      { code: 'OFFER_ALREADY_REMOVED', message: 'La oferta 1052 ya fue retirada del catálogo.' },
      { status: 409, statusText: 'Conflict' },
    );

    await expectAsync(result).toBeRejectedWith(jasmine.any(ApiError));
  });

  it('reads the moderation history page', async () => {
    const result = repository.findHistory(0, 20);

    const request = http.expectOne((r) => r.url === `${BASE_URL}/admin/moderation-actions`);
    expect(request.request.params.get('size')).toBe('20');
    request.flush({
      content: [{ moderationId: 31, offerId: 1052, offerTitle: '2x1', adminId: 1, reason: 'Precio engañoso', removedAt: '2026-11-22T15:04:05Z' }],
      page: 0,
      totalElements: 1,
      totalPages: 1,
    });

    expect((await result).items[0].offerTitle).toBe('2x1');
  });
});
