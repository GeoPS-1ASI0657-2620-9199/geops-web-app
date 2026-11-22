import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { HttpCampaignMetricsRepository } from './http-campaign-metrics.repository';

const BASE_URL = 'http://gateway.test/api/v1';

describe('HttpCampaignMetricsRepository', () => {
  let repository: HttpCampaignMetricsRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpCampaignMetricsRepository,
      ],
    });
    repository = TestBed.inject(HttpCampaignMetricsRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('asks for the metrics of the period and sends no dates for the validity of the campaign', async () => {
    const withDates = repository.findMetrics(14, { from: '2026-10-05', to: '2026-10-07' });
    http.expectOne(`${BASE_URL}/campaigns/14/metrics?from=2026-10-05&to=2026-10-07`).flush({ campaignId: 14 });
    expect((await withDates).campaignId).toBe(14);

    const validity = repository.findMetrics(14, {});
    http.expectOne(`${BASE_URL}/campaigns/14/metrics`).flush({ campaignId: 14 });
    await validity;
  });

  it('turns a 204 into no baseline and reads a declared one', async () => {
    const none = repository.findBaseline();
    http.expectOne(`${BASE_URL}/campaigns/baseline`).flush(null, { status: 204, statusText: 'No Content' });
    expect(await none).toBeNull();

    const declared = repository.findBaseline();
    http.expectOne(`${BASE_URL}/campaigns/baseline`).flush({
      businessId: 84,
      customersPerWeek: 140,
      averageTicket: 18.5,
      declaredAt: '2026-10-01T15:20:00Z',
    });
    expect(await declared).toEqual({ customersPerWeek: 140, averageTicket: 18.5, declaredAt: '2026-10-01T15:20:00Z' });
  });

  it('puts the baseline and reports the error of the service', async () => {
    const saved = repository.declareBaseline(140, 18.5);
    const request = http.expectOne(`${BASE_URL}/campaigns/baseline`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ customersPerWeek: 140, averageTicket: 18.5 });
    request.flush({ businessId: 84, customersPerWeek: 140, averageTicket: 18.5, declaredAt: '2026-10-08T13:05:00Z' });
    expect((await saved).customersPerWeek).toBe(140);

    const rejected = repository.declareBaseline(140, 18.5);
    http.expectOne(`${BASE_URL}/campaigns/baseline`).flush(
      { code: 'BUSINESS_NOT_FOUND', message: 'Business 84 is not in the catalog yet' },
      { status: 404, statusText: 'Not Found' },
    );
    await expectAsync(rejected).toBeRejectedWith(jasmine.any(ApiError));
  });
});
