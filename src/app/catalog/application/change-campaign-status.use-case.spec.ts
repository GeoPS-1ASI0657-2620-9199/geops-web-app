import { TestBed } from '@angular/core/testing';
import { PublishedCampaign } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { ChangeCampaignStatusUseCase } from './change-campaign-status.use-case';

const CAMPAIGN: PublishedCampaign = {
  campaignId: 77,
  name: 'Almuerzos de noviembre',
  description: 'Menú ejecutivo 2x1',
  period: { start: '2026-10-27', end: '2026-11-15' },
  zone: { type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 1200 },
  status: 'ACTIVE',
  offers: [
    { offerId: 1052, title: '2x1 en almuerzos', price: 18.5, validTo: '2026-11-15', category: 'Gastronomía', imageUrl: null, status: 'PUBLISHED' },
  ],
};

describe('ChangeCampaignStatusUseCase', () => {
  let campaigns: jasmine.SpyObj<CampaignRepository>;

  beforeEach(() => {
    campaigns = jasmine.createSpyObj<CampaignRepository>('CampaignRepository', ['changeStatus']);
    TestBed.configureTestingModule({ providers: [{ provide: CampaignRepository, useValue: campaigns }] });
  });

  it('pauses the campaign and keeps the offers already on screen (US10)', async () => {
    const { offers, ...withoutOffers } = CAMPAIGN;
    campaigns.changeStatus.and.resolveTo({ ...withoutOffers, status: 'PAUSED' });

    const paused = await TestBed.inject(ChangeCampaignStatusUseCase).execute(CAMPAIGN, 'PAUSED');

    expect(campaigns.changeStatus).toHaveBeenCalledOnceWith(77, 'PAUSED');
    expect(paused.status).toBe('PAUSED');
    expect(paused.offers).toEqual(offers);
  });
});
