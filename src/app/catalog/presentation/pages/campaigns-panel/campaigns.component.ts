import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { SessionStore } from '../../../../iam/application/session.store';
import { ApiError } from '../../../../shared/domain/api-error';
import { categoryIcon } from '../../../../shared/ui/category-icon';
import { GeoAlert } from '../../../../shared/ui/geo-alert/geo-alert';
import { GeoEmptyState } from '../../../../shared/ui/geo-empty-state/geo-empty-state';
import { GeoSeal, SealKind } from '../../../../shared/ui/geo-seal/geo-seal';
import { ChangeCampaignStatusUseCase } from '../../../application/change-campaign-status.use-case';
import { ListMyCampaignsUseCase } from '../../../application/list-my-campaigns.use-case';
import {
  CampaignStatus,
  PublishedCampaign,
  RequestableCampaignStatus,
  countByStatus,
  hasEnded,
  todayInLima,
} from '../../../domain/model/campaign';
import {
  CampaignStatusDialog,
  CampaignStatusDialogData,
} from '../../components/campaign-status-dialog/campaign-status-dialog';
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
  private readonly changeCampaignStatus = inject(ChangeCampaignStatusUseCase);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);
  private readonly today = todayInLima();
  protected readonly justCreated = inject(ActivatedRoute).snapshot.queryParamMap.has('created');

  protected readonly filters: Filter[] = ['ALL', 'ACTIVE', 'PAUSED', 'FINISHED'];
  protected readonly seals = CAMPAIGN_SEAL;
  protected readonly state = signal<ViewState>('loading');
  protected readonly campaigns = signal<PublishedCampaign[]>([]);
  protected readonly filter = signal<Filter>('ALL');
  protected readonly errorMessage = signal<string | null>(null);
  /** The campaign whose status is being changed; its buttons stay disabled meanwhile. */
  protected readonly changing = signal<number | null>(null);
  protected readonly statusError = signal<string | null>(null);
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

  /** Asks first; on yes, Catalog changes the status and the row shows it without reloading (US10). */
  async changeStatus(campaign: PublishedCampaign, status: RequestableCampaignStatus): Promise<void> {
    if (!(await this.confirmed(campaign, status))) {
      return;
    }
    this.statusError.set(null);
    this.changing.set(campaign.campaignId);
    try {
      const changed = await this.changeCampaignStatus.execute(campaign, status);
      this.campaigns.update((all) => all.map((c) => (c.campaignId === changed.campaignId ? changed : c)));
    } catch (error) {
      this.statusError.set(
        error instanceof ApiError ? error.message : this.translate.instant('campaignsPage.statusError'),
      );
    } finally {
      this.changing.set(null);
    }
  }

  protected ended(campaign: PublishedCampaign): boolean {
    return hasEnded(campaign, this.today);
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

  private async confirmed(campaign: PublishedCampaign, status: RequestableCampaignStatus): Promise<boolean> {
    const data: CampaignStatusDialogData = { name: campaign.name, status };
    const answer = await firstValueFrom(this.dialog.open(CampaignStatusDialog, { data }).afterClosed());
    return answer === true;
  }
}
