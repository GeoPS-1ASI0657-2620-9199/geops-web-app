import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpReportRepository } from './http-report.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const ANSWER = 'El 2x1 aplicaba de lunes a jueves.';
const REPORT = {
  reportId: 7,
  reservationId: 15,
  reservationCode: 'K7P3XM9Q',
  offerTitle: 'Menú ejecutivo a mitad de precio',
  reason: 'No me aplicaron el 2x1.',
  status: 'OPEN',
  openedAt: '2026-10-28T19:10:00Z',
  responseDeadline: '2026-10-30T19:10:00Z',
  response: null,
  resolution: null,
  resolvedAt: null,
};

describe('HttpReportRepository', () => {
  let repository: HttpReportRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpReportRepository,
      ],
    });
    repository = TestBed.inject(HttpReportRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts only the reason to the reservation', async () => {
    const result = repository.open(15, 'No me aplicaron el 2x1.');

    const request = http.expectOne(`${BASE_URL}/reservations/15/reports`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ reason: 'No me aplicaron el 2x1.' });
    request.flush(REPORT, { status: 201, statusText: 'Created' });

    expect((await result).responseDeadline).toBe('2026-10-30T19:10:00Z');
  });

  it('lists the reports, filtered by status when asked', async () => {
    const result = repository.list('OPEN');

    const request = http.expectOne((req) => req.url === `${BASE_URL}/reports`);
    expect(request.request.params.get('status')).toBe('OPEN');
    request.flush([REPORT]);

    expect((await result).map((report) => report.reportId)).toEqual([7]);
  });

  it('answers a report with the text of the business', async () => {
    const result = repository.answer(7, ANSWER);

    const request = http.expectOne(`${BASE_URL}/reports/7/responses`);
    expect(request.request.body).toEqual({ text: ANSWER });
    request.flush({ ...REPORT, status: 'IN_REVIEW', response: { text: ANSWER, respondedAt: '2026-10-29T12:00:00Z' } });

    expect((await result).response?.text).toBe(ANSWER);
  });

  it('resolves in favor of the consumer with a PATCH', async () => {
    const result = repository.resolveInFavorOfConsumer(7);

    const request = http.expectOne(`${BASE_URL}/reports/7/status`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'CLOSED', resolution: 'CONSUMER_FAVOR' });
    request.flush({ ...REPORT, status: 'CLOSED', resolution: 'CONSUMER_FAVOR', resolvedAt: '2026-10-29T12:00:00Z' });

    expect((await result).resolution).toBe('CONSUMER_FAVOR');
  });

  it('turns an API error into an ApiError', async () => {
    const result = repository.get(7);

    http
      .expectOne(`${BASE_URL}/reports/7`)
      .flush({ code: 'REPORT_NOT_FOUND', message: 'No existe' }, { status: 404, statusText: 'Not Found' });

    await expectAsync(result).toBeRejectedWithError(ApiError);
  });
});
