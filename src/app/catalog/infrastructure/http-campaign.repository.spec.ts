import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { ApiError } from '../../shared/domain/api-error';
import { CampaignDraft } from '../domain/model/campaign';
import { HttpCampaignRepository } from './http-campaign.repository';

const BASE_URL = 'http://gateway.test/api/v1';
const DRAFT: CampaignDraft = {
  name: 'Almuerzos de octubre',
  description: 'Menú ejecutivo a mitad de precio para oficinas cercanas',
  period: { start: '2026-10-05', end: '2026-10-31' },
  estimatedBudget: 500,
  storeLocation: { address: 'Av. Larco 345, Miraflores', point: { latitude: -12.1211, longitude: -77.0297 } },
  zone: { type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 },
  offers: [
    {
      title: '2x1 en almuerzos ejecutivos',
      conditions: 'Válido de lunes a viernes de 12:00 a 15:00. Un cupón por mesa.',
      price: 15,
      validTo: '2026-10-15',
      category: 'Gastronomía',
    },
  ],
};

describe('HttpCampaignRepository', () => {
  let repository: HttpCampaignRepository;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        HttpCampaignRepository,
      ],
    });
    repository = TestBed.inject(HttpCampaignRepository);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('posts the body of BRD-05 §7.3 with the budget in soles', async () => {
    const result = repository.create(DRAFT);

    const request = http.expectOne(`${BASE_URL}/campaigns`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      name: 'Almuerzos de octubre',
      description: 'Menú ejecutivo a mitad de precio para oficinas cercanas',
      period: { start: '2026-10-05', end: '2026-10-31' },
      estimatedBudget: { amount: 500, currency: 'PEN' },
      storeLocation: { address: 'Av. Larco 345, Miraflores', latitude: -12.1211, longitude: -77.0297 },
      zone: { type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 },
      offers: [
        {
          title: '2x1 en almuerzos ejecutivos',
          conditions: 'Válido de lunes a viernes de 12:00 a 15:00. Un cupón por mesa.',
          price: 15,
          validTo: '2026-10-15',
          category: 'Gastronomía',
        },
      ],
    });
    request.flush({ campaignId: 31, businessId: 84, name: 'Almuerzos de octubre', status: 'ACTIVE' }, { status: 201, statusText: 'Created' });

    expect(await result).toEqual({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });
  });

  it('sends a district zone with its center and leaves out an empty budget', async () => {
    void repository.create({
      ...DRAFT,
      estimatedBudget: null,
      zone: { type: 'DISTRICT', district: 'Miraflores', center: { latitude: -12.1215, longitude: -77.0259 } },
    });

    const body = http.expectOne(`${BASE_URL}/campaigns`).request.body;
    expect(body.zone).toEqual({ type: 'DISTRICT', district: 'Miraflores', center: { latitude: -12.1215, longitude: -77.0259 } });
    expect(body.estimatedBudget).toBeUndefined();
  });

  it('rejects with the code Catalog answers', async () => {
    const result = repository.create(DRAFT);

    http.expectOne(`${BASE_URL}/campaigns`).flush(
      { code: 'CAMPAIGN_ALREADY_ENDED', message: 'La vigencia de la campaña terminó el 2026-09-30. Elige una fecha de fin desde hoy.' },
      { status: 400, statusText: 'Bad Request' },
    );

    await expectAsync(result).toBeRejectedWith(
      new ApiError('CAMPAIGN_ALREADY_ENDED', 'La vigencia de la campaña terminó el 2026-09-30. Elige una fecha de fin desde hoy.'),
    );
  });
});
