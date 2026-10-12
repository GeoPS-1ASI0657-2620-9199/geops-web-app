import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { BusinessProfileGateway } from '../../../../iam/domain/ports/business-profile.gateway';
import { VerificationStatus } from '../../../../iam/domain/model/business-verification';
import { ApiError, NETWORK_ERROR } from '../../../../shared/domain/api-error';
import { CampaignRepository } from '../../../domain/ports/campaign.repository';
import { BusinessSummaryPage } from './business-summary.page';

const OWNER: Session = {
  accessToken: 't',
  expiresAt: Date.now() + 60_000,
  userId: 42,
  role: 'BUSINESS_OWNER',
  email: 'mirta@correo.pe',
  businessId: 30,
  businessName: 'Menús Doña Mirta',
};
const base = {
  description: '',
  period: { start: '2026-10-09', end: '2099-12-23' },
  zone: { type: 'RADIUS' as const, center: { latitude: -12.12, longitude: -77.03 }, radiusMeters: 800 },
};

describe('BusinessSummaryPage', () => {
  let status: VerificationStatus = 'UNVERIFIED';
  const profiles = {
    find: () =>
      Promise.resolve({ id: 30, businessName: 'Menús Doña Mirta', ruc: '20123456786', address: 'Jr. Huánuco 1250', verificationStatus: status, lastVerification: null }),
    verify: () => Promise.reject(new Error('not used')),
  };
  const render = async (findMine: Promise<never[]> | Promise<object[]>) => {
    const campaigns = jasmine.createSpyObj<CampaignRepository>('CampaignRepository', ['create', 'findMine', 'findOffers']);
    campaigns.findMine.and.returnValue(findMine as never);
    campaigns.findOffers.and.resolveTo([
      { offerId: 1, title: 'Menú', price: 14, validTo: '2099-12-01', category: 'Gastronomía', imageUrl: null, status: 'PUBLISHED' },
    ]);
    await TestBed.configureTestingModule({
      imports: [BusinessSummaryPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: CampaignRepository, useValue: campaigns },
        { provide: BusinessProfileGateway, useValue: profiles },
        { provide: SessionStorage, useValue: { read: () => OWNER, write: () => undefined, clear: () => undefined } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BusinessSummaryPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the active campaigns, the published offers and the reach of the newest one (Figma 11)', async () => {
    const host = await render(
      Promise.resolve([
        { ...base, campaignId: 2, name: 'Menú del día', status: 'ACTIVE' },
        { ...base, campaignId: 1, name: 'Cena criolla', status: 'FINISHED' },
      ]),
    );
    const figures = [...host.querySelectorAll('.figure')].map((f) => f.textContent?.trim());

    expect(figures).toEqual(['1', '1', '800 m', '1']);
    expect(host.querySelectorAll('.row').length).toBe(1);
    expect(host.textContent).toContain('Menú del día');
    expect(host.querySelector('geo-offers-map')).not.toBeNull();
  });

  it('offers a retry when Catalog cannot be reached', async () => {
    const host = await render(Promise.reject(new ApiError(NETWORK_ERROR, 'sin conexión')));
    expect(host.textContent).toContain('campaignsPage.error.title');
  });

  it('shows the verified seal only when Identity has the business verified (E2-16)', async () => {
    status = 'VERIFIED';
    const host = await render(Promise.resolve([]));

    expect(host.querySelector('[data-testid="business-seal"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="verify-business-link"]')).toBeNull();
  });

  it('links to "Verificar mi comercio" when the business has no seal (US38)', async () => {
    status = 'UNVERIFIED';
    const host = await render(Promise.resolve([]));

    expect(host.querySelector('[data-testid="business-seal"]')).toBeNull();
    expect(host.querySelector('[data-testid="verify-business-link"]')?.getAttribute('href')).toBe('/business/verify');
  });
});
