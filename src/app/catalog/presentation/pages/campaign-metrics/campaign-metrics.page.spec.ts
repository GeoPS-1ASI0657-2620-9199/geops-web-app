import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ApiError } from '../../../../shared/domain/api-error';
import { CampaignMetrics, CampaignMetricsSummary } from '../../../domain/model/campaign-metrics';
import { CampaignMetricsRepository } from '../../../domain/ports/campaign-metrics.repository';
import { CampaignMetricsPage } from './campaign-metrics.page';

const METRICS: CampaignMetrics = {
  campaignId: 14,
  campaignName: 'Almuerzos de octubre',
  status: 'ACTIVE',
  period: { from: '2026-10-05', to: '2026-10-07', days: 3 },
  totals: { impressions: 640, clicks: 48, reservations: 12, redemptions: 9 },
  rates: { clickThroughRate: 7.5, reservationRate: 25, redemptionRate: 75, conversionRate: 18.8 },
  daily: [
    { date: '2026-10-05', impressions: 210, clicks: 15, reservations: 4, redemptions: 3 },
    { date: '2026-10-06', impressions: 0, clicks: 0, reservations: 0, redemptions: 0 },
    { date: '2026-10-07', impressions: 430, clicks: 33, reservations: 8, redemptions: 6 },
  ],
  baseline: null,
};
const SUMMARY: CampaignMetricsSummary = {
  period: METRICS.period,
  campaigns: [
    { campaignId: 14, name: 'Almuerzos de octubre', status: 'ACTIVE', totals: METRICS.totals, rates: METRICS.rates },
    {
      campaignId: 15,
      name: 'Ceviches en Miraflores',
      status: 'PAUSED',
      totals: { impressions: 0, clicks: 0, reservations: 0, redemptions: 0 },
      rates: { clickThroughRate: null, reservationRate: null, redemptionRate: null, conversionRate: null },
    },
  ],
};

describe('CampaignMetricsPage', () => {
  let repository: jasmine.SpyObj<CampaignMetricsRepository>;
  let fixture: ComponentFixture<CampaignMetricsPage>;

  const render = async (metrics: CampaignMetrics | Error = METRICS) => {
    repository = jasmine.createSpyObj<CampaignMetricsRepository>('CampaignMetricsRepository', [
      'findMetrics',
      'findSummary',
      'findBaseline',
      'declareBaseline',
    ]);
    if (metrics instanceof Error) {
      repository.findMetrics.and.rejectWith(metrics);
    } else {
      repository.findMetrics.and.resolveTo(metrics);
    }
    repository.findSummary.and.resolveTo(SUMMARY);
    await TestBed.configureTestingModule({
      imports: [CampaignMetricsPage],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: CampaignMetricsRepository, useValue: repository },
        { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ id: '14' })) } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CampaignMetricsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('shows the five figures of the campaign for its validity and one bar per day', async () => {
    const page = await render();

    expect(repository.findMetrics).toHaveBeenCalledWith(14, {});
    expect(repository.findSummary).toHaveBeenCalledWith({ from: '2026-10-05', to: '2026-10-07' });
    expect(page.querySelector('[data-testid="kpi-impressions"]')?.textContent).toContain('640');
    expect(page.querySelector('[data-testid="kpi-clicks"]')?.textContent).toContain('48');
    expect(page.querySelector('[data-testid="kpi-reservations"]')?.textContent).toContain('12');
    expect(page.querySelector('[data-testid="kpi-redemptions"]')?.textContent).toContain('9');
    expect(page.querySelector('[data-testid="kpi-conversion"]')?.textContent).toContain('18.8 %');
    expect(page.querySelectorAll('.bar').length).toBe(3);
  });

  it('lists the campaigns without activity with zeros, not leaving them out', async () => {
    const page = await render();

    expect(page.textContent).toContain('Ceviches en Miraflores');
    expect(page.querySelectorAll('.table tbody tr').length).toBe(2);
  });

  it('asks for the last seven days when the owner picks them', async () => {
    const page = await render();
    repository.findMetrics.calls.reset();

    (page.querySelectorAll('.periods .chip')[1] as HTMLButtonElement).click();
    await fixture.whenStable();

    const period = repository.findMetrics.calls.mostRecent().args[1];
    expect(period.from).toBeDefined();
    expect(period.to).toBeDefined();
  });

  it('without a baseline shows the absolute figures and invites to declare it', async () => {
    const page = await render();

    expect(page.querySelector('[data-testid="baseline-invite"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="baseline-form"]')).not.toBeNull();
    expect(page.querySelector('[data-testid="baseline-change"]')).toBeNull();
  });

  it('with a baseline shows the change in percent', async () => {
    const page = await render({
      ...METRICS,
      baseline: {
        customersPerWeek: 140,
        averageTicket: 18.5,
        declaredAt: '2026-10-01T15:20:00Z',
        expectedCustomers: 60,
        campaignCustomers: 9,
        customersChangePercent: 15,
        estimatedExtraSales: 166.5,
      },
    });

    expect(page.querySelector('[data-testid="baseline-change"]')?.textContent).toContain('+15.0 %');
    expect(page.querySelector('[data-testid="baseline-form"]')).toBeNull();
    expect(page.textContent).toContain('166.50');
  });

  it('saves the baseline and reloads the comparison', async () => {
    const page = await render();
    repository.declareBaseline.and.resolveTo({ customersPerWeek: 140, averageTicket: 18.5, declaredAt: '2026-10-08T13:05:00Z' });
    const inputs = page.querySelectorAll<HTMLInputElement>('[data-testid="baseline-form"] input');
    inputs[0].value = '140';
    inputs[0].dispatchEvent(new Event('input'));
    inputs[1].value = '18.5';
    inputs[1].dispatchEvent(new Event('input'));
    repository.findMetrics.calls.reset();

    page.querySelector<HTMLFormElement>('[data-testid="baseline-form"]')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(repository.declareBaseline).toHaveBeenCalledWith(140, 18.5);
    expect(repository.findMetrics).toHaveBeenCalled();
  });

  it('does not send a baseline without customers', async () => {
    const page = await render();

    page.querySelector<HTMLFormElement>('[data-testid="baseline-form"]')!.dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    fixture.detectChanges();

    expect(repository.declareBaseline).not.toHaveBeenCalled();
    expect(page.querySelector('[data-testid="baseline-form"] .error')).not.toBeNull();
  });

  it('shows the message of the service when the campaign belongs to another business', async () => {
    const page = await render(new ApiError('FORBIDDEN', 'Campaign 14 belongs to another account'));

    expect(page.textContent).toContain('Campaign 14 belongs to another account');
  });

  it('writes one day and one customer in singular', async () => {
    const oneDay = { from: '2026-10-05', to: '2026-10-05', days: 1 };
    await render({
      ...METRICS,
      period: oneDay,
      daily: [METRICS.daily[0]],
      baseline: {
        customersPerWeek: 140,
        averageTicket: 18.5,
        declaredAt: '2026-10-01T15:20:00Z',
        expectedCustomers: 20,
        campaignCustomers: 1,
        customersChangePercent: -95,
        estimatedExtraSales: 0,
      },
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('es', {
      campaignMetrics: {
        periodLabel: 'Del {{from}} al {{to}} · {{days}}',
        units: { days: '{{count}} días', daysOne: '{{count}} día', customers: '{{count}} clientes', customersOne: '{{count}} cliente' },
        baseline: { comparison: 'La campaña trajo {{customers}} con canje; sin GeoPS atiendes unos {{expected}} en {{days}}.' },
      },
    });
    translate.use('es');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('· 1 día');
    expect(text).toContain('La campaña trajo 1 cliente con canje');
    expect(text).toContain('en 1 día.');
    expect(text).not.toContain('días');
  });

  it('keeps the daily table hidden inside a 1 px wrapper so it never widens the page', async () => {
    const page = await render();
    const wrapper = page.querySelector<HTMLElement>('.visually-hidden')!;

    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.querySelector('table')).not.toBeNull();
    expect(getComputedStyle(wrapper).width).toBe('1px');
    expect(getComputedStyle(wrapper).overflow).toBe('hidden');
  });
});
