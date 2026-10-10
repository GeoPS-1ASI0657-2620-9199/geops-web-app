import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_BASE_URL } from '../../core/config/api-base-url';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { HttpCampaignRepository } from '../infrastructure/http-campaign.repository';
import { ListMyCampaignsUseCase } from './list-my-campaigns.use-case';

const BASE_URL = 'http://gateway.test/api/v1';
const campaign = (campaignId: number, zone: object) => ({
  campaignId,
  businessId: 30,
  name: `Campaña ${campaignId}`,
  description: null,
  period: { start: '2026-10-09', end: '2026-12-23' },
  zone,
  status: 'ACTIVE',
  estimatedBudget: { amount: 300, currency: 'PEN' },
});

describe('ListMyCampaignsUseCase over HttpCampaignRepository', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: BASE_URL },
        { provide: CampaignRepository, useClass: HttpCampaignRepository },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('reads the campaigns of the token and the offers of each one, newest first (US10)', async () => {
    const result = TestBed.inject(ListMyCampaignsUseCase).execute();

    http.expectOne({ method: 'GET', url: `${BASE_URL}/campaigns` }).flush([
      campaign(4, { type: 'DISTRICT', center: { latitude: -12.1215, longitude: -77.0259 }, radiusMeters: null, district: 'Miraflores' }),
      campaign(9, { type: 'RADIUS', center: { latitude: -12.12, longitude: -77.03 }, radiusMeters: 800, district: null }),
    ]);
    await new Promise((resolve) => setTimeout(resolve));
    http.expectOne(`${BASE_URL}/campaigns/4/offers`).flush([]);
    http.expectOne(`${BASE_URL}/campaigns/9/offers`).flush([
      { offerId: 40, title: 'Ceviche', price: 24, validTo: '2026-12-08', category: 'Gastronomía', imageUrl: null, status: 'PUBLISHED' },
    ]);

    const campaigns = await result;
    expect(campaigns.map((c) => c.campaignId)).toEqual([9, 4]);
    expect(campaigns[0].zone).toEqual({ type: 'RADIUS', center: { latitude: -12.12, longitude: -77.03 }, radiusMeters: 800 });
    expect(campaigns[1].zone).toEqual({ type: 'DISTRICT', district: 'Miraflores', center: { latitude: -12.1215, longitude: -77.0259 } });
    expect(campaigns[0].offers[0]).toEqual(jasmine.objectContaining({ offerId: 40, price: 24, status: 'PUBLISHED' }));
  });
});
