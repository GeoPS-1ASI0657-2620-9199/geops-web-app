import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoOffersMap, MapPin } from '../../../../shared/ui/geo-offers-map/geo-offers-map';
import { GeoSeal } from '../../../../shared/ui/geo-seal/geo-seal';
import { ListMyCampaignsUseCase } from '../../../application/list-my-campaigns.use-case';
import { CampaignZone, PublishedCampaign, countByStatus } from '../../../domain/model/campaign';
import { DISTRICT_COVERAGE_METERS, campaignPeriodLabel, zoneLabel } from '../../campaign-view';

type ViewState = 'loading' | 'ready' | 'error';

/**
 * "Resumen" of the business (Figma screen 11): greeting, the figures Catalog can give in this sprint
 * (active campaigns, published offers, reach) and the active campaigns with their zone on the map.
 */
@Component({
  selector: 'app-business-summary',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoEmptyState, GeoOffersMap, GeoSeal],
  templateUrl: './business-summary.page.html',
  styleUrl: './business-summary.page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessSummaryPage implements OnInit {
  protected readonly sessions = inject(SessionStore);
  private readonly listCampaigns = inject(ListMyCampaignsUseCase);

  protected readonly state = signal<ViewState>('loading');
  protected readonly campaigns = signal<PublishedCampaign[]>([]);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly counts = computed(() => countByStatus(this.campaigns()));
  protected readonly active = computed(() => this.campaigns().filter((c) => c.status === 'ACTIVE'));
  protected readonly publishedOffers = computed(() =>
    this.active().reduce((total, c) => total + c.offers.filter((o) => o.status === 'PUBLISHED').length, 0),
  );
  /** The zone of the newest active campaign, the one the map shows. */
  protected readonly zone = computed<CampaignZone | null>(() => this.active()[0]?.zone ?? null);
  protected readonly reachMeters = computed(() => {
    const zone = this.zone();
    return zone ? (zone.type === 'DISTRICT' ? DISTRICT_COVERAGE_METERS : zone.radiusMeters) : null;
  });
  protected readonly pins = computed<MapPin[]>(() => {
    const campaign = this.active()[0];
    return campaign
      ? [{ id: campaign.campaignId, point: campaign.zone.center, icon: categoryIcon(campaign.offers[0]?.category), label: campaign.name, kind: 'verified' }]
      : [];
  });

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      this.campaigns.set(await this.listCampaigns.execute());
      this.state.set('ready');
    } catch (error) {
      this.errorMessage.set(error instanceof ApiError ? error.message : null);
      this.state.set('error');
    }
  }

  protected icon(campaign: PublishedCampaign): string {
    return categoryIcon(campaign.offers[0]?.category);
  }

  protected period(campaign: PublishedCampaign): string {
    return campaignPeriodLabel(campaign);
  }

  protected zoneText(zone: CampaignZone): string {
    return zoneLabel(zone);
  }
}
