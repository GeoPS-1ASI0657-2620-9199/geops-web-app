import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { CampaignsComponent } from './campaigns.component';
import { CampaignRepository } from '../../../domain/ports/campaign.repository';

class OwnerStorage extends SessionStorage {
  override read(): Session {
    return {
      accessToken: 't',
      expiresAt: Date.now() + 60_000,
      userId: 42,
      role: 'BUSINESS_OWNER',
      email: 'mirta@correo.pe',
      businessName: 'Menús Doña Mirta',
    };
  }
  override write(): void {}
  override clear(): void {}
}

describe('CampaignsComponent', () => {
  let campaigns: jasmine.SpyObj<CampaignRepository>;

  const render = async (query: Record<string, string> = {}) => {
    campaigns = jasmine.createSpyObj<CampaignRepository>('CampaignRepository', ['create', 'findMine', 'findOffers']);
    campaigns.findMine.and.resolveTo([]);
    await TestBed.configureTestingModule({
      imports: [CampaignsComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useClass: OwnerStorage },
        { provide: CampaignRepository, useValue: campaigns },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CampaignsComponent);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).textContent ?? '';
  };

  it('shows the business of the session and the entry to publish a campaign', async () => {
    const text = await render();

    expect(text).toContain('Menús Doña Mirta');
    expect(text).toContain('campaignsPage.new');
    expect(text).not.toContain('campaignsPage.created.title');
  });

  it('confirms the campaign just published', async () => {
    expect(await render({ created: '1' })).toContain('campaignsPage.created.title');
  });

  it('lists every campaign with its status and filters by it (Figma 12)', async () => {
    const zone = { type: 'RADIUS' as const, center: { latitude: -12.12, longitude: -77.03 }, radiusMeters: 800 };
    const period = { start: '2026-10-09', end: '2099-12-23' };
    TestBed.resetTestingModule();
    campaigns = jasmine.createSpyObj<CampaignRepository>('CampaignRepository', ['create', 'findMine', 'findOffers']);
    campaigns.findMine.and.resolveTo([
      { campaignId: 2, name: 'Menú del día', description: '', period, zone, status: 'ACTIVE' },
      { campaignId: 1, name: 'Cena criolla', description: '', period, zone, status: 'FINISHED' },
    ]);
    campaigns.findOffers.and.resolveTo([
      { offerId: 9, title: 'Menú', price: 14, validTo: '2099-12-01', category: 'Gastronomía', imageUrl: null, status: 'PUBLISHED' },
    ]);
    await TestBed.configureTestingModule({
      imports: [CampaignsComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useClass: OwnerStorage },
        { provide: CampaignRepository, useValue: campaigns },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
    const view = TestBed.createComponent(CampaignsComponent);
    view.detectChanges();
    await view.whenStable();
    view.detectChanges();
    const host = view.nativeElement as HTMLElement;

    expect(host.querySelectorAll('tbody tr').length).toBe(2);
    expect(host.textContent).toContain('800 m alrededor del local');

    [...host.querySelectorAll<HTMLButtonElement>('button.chip')].find((b) => b.textContent?.includes('filters.FINISHED'))!.click();
    view.detectChanges();

    expect(host.querySelectorAll('tbody tr').length).toBe(1);
    expect(host.textContent).toContain('Cena criolla');
  });
});
