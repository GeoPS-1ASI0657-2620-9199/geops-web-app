import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal, SealKind } from '../../../../shared/ui/geo-seal/geo-seal';
import { ListMyCampaignsUseCase } from '../../../application/list-my-campaigns.use-case';
import { CampaignStatus, PublishedCampaign, countByStatus } from '../../../domain/model/campaign';
import { campaignPeriodLabel, zoneLabel } from '../../campaign-view';

type ViewState = 'loading' | 'ready' | 'empty' | 'error';
type Filter = CampaignStatus | 'ALL';

export const CAMPAIGN_SEAL: Record<CampaignStatus, SealKind> = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  FINISHED: 'unverified',
};

/** "Mis campañas" of the business owner (US10, Figma screen 12): every campaign with its status. */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [DecimalPipe, RouterLink, MatButtonModule, MatIconModule, TranslateModule, GeoAlert, GeoEmptyState, GeoSeal],
  templateUrl: './campaigns.component.html',
  styleUrl: './campaigns.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent implements OnInit {
  protected readonly sessions = inject(SessionStore);
  private readonly listCampaigns = inject(ListMyCampaignsUseCase);
  protected readonly justCreated = inject(ActivatedRoute).snapshot.queryParamMap.has('created');

  protected readonly filters: Filter[] = ['ALL', 'ACTIVE', 'PAUSED', 'FINISHED'];
  protected readonly seals = CAMPAIGN_SEAL;
  protected readonly state = signal<ViewState>('loading');
  protected readonly campaigns = signal<PublishedCampaign[]>([]);
  protected readonly filter = signal<Filter>('ALL');
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly counts = computed(() => countByStatus(this.campaigns()));
  protected readonly visible = computed(() =>
    this.campaigns().filter((campaign) => this.filter() === 'ALL' || campaign.status === this.filter()),
  );

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    try {
      const campaigns = await this.listCampaigns.execute();
      this.campaigns.set(campaigns);
      this.state.set(campaigns.length ? 'ready' : 'empty');
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

  protected zone(campaign: PublishedCampaign): string {
    return zoneLabel(campaign.zone);
  }
}
