import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe, formatNumber } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ApiError } from '../../../../shared/domain/api-error';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { DeclareBaselineUseCase, InvalidBaselineError } from '../../../application/declare-baseline.use-case';
import { CampaignMetricsView, GetCampaignMetricsUseCase } from '../../../application/get-campaign-metrics.use-case';
import { todayInLima } from '../../../domain/model/campaign';
import {
  MetricSeries,
  PeriodPreset,
  PeriodRequest,
  barShares,
  customPeriodError,
  periodFor,
} from '../../../domain/model/campaign-metrics';
import { CAMPAIGN_SEAL } from '../campaigns-panel/campaigns.component';
import { GeoTicketCalculator } from '../../../../shared/ui/geo-ticket-calculator/geo-ticket-calculator';

type ViewState = 'loading' | 'ready' | 'error';

/**
 * Métricas de una campaña (US11) con su comparación contra la línea base del negocio (US45): cifras del
 * periodo elegido, la actividad de cada día y el formulario para declarar o corregir la línea base.
 */
@Component({
  selector: 'app-campaign-metrics',
  standalone: true,
  imports: [DecimalPipe, FormsModule, RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState, GeoSeal, GeoTicketCalculator],
  templateUrl: './campaign-metrics.page.html',
  styleUrl: './campaign-metrics.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignMetricsPage implements OnInit {
  private readonly getMetrics = inject(GetCampaignMetricsUseCase);
  private readonly declareBaseline = inject(DeclareBaselineUseCase);
  private readonly translate = inject(TranslateService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private campaignId = 0;
  private readonly today = todayInLima();

  protected readonly presets: Exclude<PeriodPreset, 'custom'>[] = ['campaign', 'last7', 'last30'];
  protected readonly seriesOptions: MetricSeries[] = ['impressions', 'clicks', 'reservations', 'redemptions'];
  protected readonly seals = CAMPAIGN_SEAL;
  protected readonly state = signal<ViewState>('loading');
  protected readonly view = signal<CampaignMetricsView | null>(null);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly preset = signal<PeriodPreset>('campaign');
  protected readonly customFrom = signal('');
  protected readonly customTo = signal('');
  protected readonly periodError = signal<string | null>(null);
  protected readonly series = signal<MetricSeries>('impressions');
  protected readonly formOpen = signal(false);
  protected readonly customersPerWeek = signal<number | null>(null);
  protected readonly averageTicket = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly saved = signal(false);

  protected readonly metrics = computed(() => this.view()?.metrics ?? null);
  protected readonly bars = computed(() => {
    const metrics = this.metrics();
    if (!metrics) {
      return [];
    }
    const shares = barShares(metrics.daily, this.series());
    return metrics.daily.map((day, index) => ({ date: day.date, value: day[this.series()], share: shares[index] }));
  });
  protected readonly peak = computed(() => Math.max(0, ...this.bars().map((bar) => bar.value)));
  protected readonly showForm = computed(() => this.formOpen() || (this.state() === 'ready' && !this.metrics()?.baseline));

  /** The page stays mounted when the owner jumps to another campaign from the table, so it follows the route. */
  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.campaignId = Number(params.get('id'));
      this.preset.set('campaign');
      this.formOpen.set(false);
      this.saved.set(false);
      void this.load();
    });
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.view.set(await this.getMetrics.execute(this.campaignId, this.periodRequest()));
      this.state.set('ready');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.state.set('error');
    }
  }

  protected choosePreset(preset: Exclude<PeriodPreset, 'custom'>): void {
    this.preset.set(preset);
    this.periodError.set(null);
    void this.load();
  }

  protected openCustom(): void {
    const metrics = this.metrics();
    this.preset.set('custom');
    if (metrics && !this.customFrom()) {
      this.customFrom.set(metrics.period.from);
      this.customTo.set(metrics.period.to);
    }
  }

  protected applyCustom(): void {
    const reason = customPeriodError(this.customFrom(), this.customTo());
    this.periodError.set(reason ? this.translate.instant('campaignMetrics.period.errors.' + reason) : null);
    if (!reason) {
      void this.load();
    }
  }

  protected openForm(): void {
    const baseline = this.metrics()?.baseline;
    this.customersPerWeek.set(baseline?.customersPerWeek ?? null);
    this.averageTicket.set(baseline?.averageTicket ?? null);
    this.formError.set(null);
    this.saved.set(false);
    this.formOpen.set(true);
  }

  protected async saveBaseline(): Promise<void> {
    this.formError.set(null);
    this.saving.set(true);
    try {
      await this.declareBaseline.execute(this.customersPerWeek(), this.averageTicket());
      this.formOpen.set(false);
      this.saved.set(true);
      await this.load();
    } catch (error) {
      if (error instanceof InvalidBaselineError) {
        this.formError.set(this.translate.instant('campaignMetrics.baseline.errors.' + error.reason));
      } else {
        this.formError.set(error instanceof ApiError ? error.message : this.translate.instant('campaignMetrics.baseline.errors.save'));
      }
    } finally {
      this.saving.set(false);
    }
  }

  /** "7.5 % de las impresiones", or a dash text when there is nothing to divide by yet. */
  protected rateHint(key: string, rate: number | null): string {
    if (rate === null) {
      return this.translate.instant('campaignMetrics.kpi.noBase');
    }
    return this.translate.instant('campaignMetrics.kpi.' + key, { rate: formatNumber(rate, this.locale(), '1.1-1') });
  }

  /** "12 oct" in the language of the page; days are of Lima and formatted as UTC dates. */
  protected day(isoDay: string, withYear = false): string {
    const [year, month, date] = isoDay.split('-').map(Number);
    return new Intl.DateTimeFormat(this.intlLocale(), {
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, date)));
  }

  protected declaredOn(instant: string): string {
    return this.day(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima' }).format(new Date(instant)), true);
  }

  /** Key of "1 día" or "3 días": Spanish and English need the singular when the count is one. */
  /** Customers are whole people: the expected count from the weekly baseline is rounded. */
  protected roundCustomers(value: number): number {
    return Math.round(value);
  }

  protected unit(name: 'days' | 'customers', count: number): string {
    return 'campaignMetrics.units.' + name + (count === 1 ? 'One' : '');
  }

  /** A label every few bars so a 30-day chart does not print 30 overlapping dates. */
  protected showsLabel(index: number, total: number): boolean {
    const step = Math.ceil(total / 7);
    return index % step === 0 || index === total - 1;
  }

  private intlLocale(): string {
    return this.translate.currentLang === 'en' ? 'en-US' : 'es-PE';
  }

  /** Locale registered in Angular for formatNumber; only en-US is, so numbers keep the dot of the API. */
  private locale(): string {
    return 'en-US';
  }

  private periodRequest(): PeriodRequest {
    const preset = this.preset();
    return preset === 'custom' ? { from: this.customFrom(), to: this.customTo() } : periodFor(preset, this.today);
  }
}
