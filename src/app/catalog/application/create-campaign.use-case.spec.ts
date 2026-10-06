import { TestBed } from '@angular/core/testing';
import { ApiError } from '../../shared/domain/api-error';
import { CampaignDraft } from '../domain/model/campaign';
import { CampaignRepository } from '../domain/ports/campaign.repository';
import { CreateCampaignUseCase } from './create-campaign.use-case';

const NOW = new Date('2026-10-05T15:00:00Z');
const DRAFT: CampaignDraft = {
  businessName: 'Restaurante Don Pepe',
  name: '  Almuerzos de octubre ',
  description: '',
  period: { start: '2026-10-05', end: '2026-10-31' },
  estimatedBudget: null,
  storeLocation: { address: ' Av. Larco 345 ', point: { latitude: -12.1211, longitude: -77.0297 } },
  zone: { type: 'RADIUS', center: { latitude: -12.1211, longitude: -77.0297 }, radiusMeters: 800 },
  offers: [{ title: ' 2x1 ', conditions: 'Un cupón por mesa.', price: 15, validTo: '2026-10-15', category: 'Gastronomía' }],
};

describe('CreateCampaignUseCase', () => {
  let campaigns: jasmine.SpyObj<CampaignRepository>;
  let useCase: CreateCampaignUseCase;

  beforeEach(() => {
    campaigns = jasmine.createSpyObj<CampaignRepository>('CampaignRepository', ['create']);
    campaigns.create.and.resolveTo({ campaignId: 31, name: 'Almuerzos de octubre', status: 'ACTIVE' });
    TestBed.configureTestingModule({ providers: [{ provide: CampaignRepository, useValue: campaigns }] });
    useCase = TestBed.inject(CreateCampaignUseCase);
  });

  it('publishes a valid campaign with its texts trimmed', async () => {
    await useCase.execute(DRAFT, NOW);

    const sent = campaigns.create.calls.mostRecent().args[0];
    expect(sent.name).toBe('Almuerzos de octubre');
    expect(sent.businessName).toBe('Restaurante Don Pepe');
    expect(sent.storeLocation.address).toBe('Av. Larco 345');
    expect(sent.offers[0].title).toBe('2x1');
  });

  it('does not call Catalog when the validity already ended (CA-05.3)', async () => {
    const ended = { ...DRAFT, period: { start: '2026-09-01', end: '2026-09-30' } };

    await expectAsync(useCase.execute(ended, NOW)).toBeRejectedWith(
      jasmine.objectContaining<ApiError>({ code: 'CAMPAIGN_ALREADY_ENDED' }),
    );
    expect(campaigns.create).not.toHaveBeenCalled();
  });
});
