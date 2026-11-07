import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Session } from '../../../../iam/domain/model/session';
import { SessionStorage } from '../../../../iam/domain/ports/session.storage';
import { CampaignsComponent } from './campaigns.component';
import { CampaignRepository } from '../../../domain/ports/campaign.repository';
import { ApiError } from '../../../../shared/domain/api-error';
import { PublishedCampaign } from '../../../domain/model/campaign';

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

describe('CampaignsComponent pause and reactivate (US10)', () => {
  const zone = { type: 'RADIUS' as const, center: { latitude: -12.12, longitude: -77.03 }, radiusMeters: 800 };
  const current = { start: '2026-10-09', end: '2099-12-23' };
  const past = { start: '2026-01-05', end: '2026-01-31' };
  const offer = { offerId: 9, title: 'Menú', price: 14, validTo: '2099-12-01', category: 'Gastronomía', imageUrl: null, status: 'PUBLISHED' };
  let campaigns: jasmine.SpyObj<CampaignRepository>;
  let dialog: jasmine.SpyObj<MatDialog>;
  let view: ComponentFixture<CampaignsComponent>;

  const render = async (mine: Omit<PublishedCampaign, 'offers'>[], answer = true) => {
    campaigns = jasmine.createSpyObj<CampaignRepository>('CampaignRepository', ['findMine', 'findOffers', 'changeStatus']);
    campaigns.findMine.and.resolveTo(mine);
    campaigns.findOffers.and.resolveTo([offer]);
    dialog = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    dialog.open.and.returnValue({ afterClosed: () => of(answer) } as ReturnType<MatDialog['open']>);
    await TestBed.configureTestingModule({
      imports: [CampaignsComponent],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: SessionStorage, useClass: OwnerStorage },
        { provide: CampaignRepository, useValue: campaigns },
        { provide: MatDialog, useValue: dialog },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
      ],
    }).compileComponents();
    view = TestBed.createComponent(CampaignsComponent);
    view.detectChanges();
    await view.whenStable();
    view.detectChanges();
    return view.nativeElement as HTMLElement;
  };

  const settle = async () => {
    await view.whenStable();
    view.detectChanges();
  };

  it('pauses an active campaign after the confirmation and shows it paused without reloading', async () => {
    const host = await render([{ campaignId: 2, name: 'Menú del día', description: '', period: current, zone, status: 'ACTIVE' }]);
    campaigns.changeStatus.and.resolveTo({ campaignId: 2, name: 'Menú del día', description: '', period: current, zone, status: 'PAUSED' });

    host.querySelector<HTMLButtonElement>('[data-testid="pause"]')!.click();
    await settle();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(campaigns.changeStatus).toHaveBeenCalledOnceWith(2, 'PAUSED');
    expect(campaigns.findMine).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain('campaignsPage.status.PAUSED');
    expect(host.querySelector('[data-testid="reactivate"]')).not.toBeNull();
    expect(host.querySelector('[data-testid="pause"]')).toBeNull();
  });

  it('changes nothing when the owner cancels the confirmation', async () => {
    const host = await render([{ campaignId: 2, name: 'Menú del día', description: '', period: current, zone, status: 'ACTIVE' }], false);

    host.querySelector<HTMLButtonElement>('[data-testid="pause"]')!.click();
    await settle();

    expect(campaigns.changeStatus).not.toHaveBeenCalled();
    expect(host.textContent).toContain('campaignsPage.status.ACTIVE');
  });

  it('reactivates a paused campaign whose validity has not ended', async () => {
    const host = await render([{ campaignId: 3, name: 'Cena criolla', description: '', period: current, zone, status: 'PAUSED' }]);
    campaigns.changeStatus.and.resolveTo({ campaignId: 3, name: 'Cena criolla', description: '', period: current, zone, status: 'ACTIVE' });

    host.querySelector<HTMLButtonElement>('[data-testid="reactivate"]')!.click();
    await settle();

    expect(campaigns.changeStatus).toHaveBeenCalledOnceWith(3, 'ACTIVE');
    expect(host.textContent).toContain('campaignsPage.status.ACTIVE');
  });

  it('disables reactivating a paused campaign whose validity ended and says why', async () => {
    const host = await render([{ campaignId: 4, name: 'Desayunos de enero', description: '', period: past, zone, status: 'PAUSED' }]);

    expect(host.querySelector<HTMLButtonElement>('[data-testid="reactivate"]')!.disabled).toBeTrue();
    expect(host.textContent).toContain('campaignsPage.validityEnded');
  });

  it('shows the message of Catalog when the change is rejected', async () => {
    const host = await render([{ campaignId: 3, name: 'Cena criolla', description: '', period: current, zone, status: 'PAUSED' }]);
    campaigns.changeStatus.and.rejectWith(
      new ApiError('CAMPAIGN_ALREADY_ENDED', 'La campaña terminó el 2026-11-15. Ya no se puede pausar ni reactivar.'),
    );

    host.querySelector<HTMLButtonElement>('[data-testid="reactivate"]')!.click();
    await settle();

    expect(host.textContent).toContain('La campaña terminó el 2026-11-15. Ya no se puede pausar ni reactivar.');
    expect(host.textContent).toContain('campaignsPage.status.PAUSED');
    expect(host.querySelector<HTMLButtonElement>('[data-testid="reactivate"]')!.disabled).toBeFalse();
  });

  it('offers no status button for a finished campaign', async () => {
    const host = await render([{ campaignId: 1, name: 'Cena criolla', description: '', period: past, zone, status: 'FINISHED' }]);

    expect(host.querySelector('[data-testid="pause"]')).toBeNull();
    expect(host.querySelector('[data-testid="reactivate"]')).toBeNull();
  });
});
