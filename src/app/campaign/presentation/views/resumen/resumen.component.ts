import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign, CampaignStatus } from '../../../domain/model/campaign.entity';
import { calculateCtr } from '../../../domain/utils/campaign-metrics.util';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';
import { WelcomeBannerComponent } from '../../../../subscriptions/presentation/components/welcome-banner/welcome-banner.component';

type DialogAction = 'pause' | 'activate' | 'finalize' | 'delete';
type NotificationKey = 'pauseSuccess' | 'activateSuccess' | 'finalizeSuccess' | 'deleteSuccess';

/**
 * ResumenComponent
 *
 * Dashboard summary view showing campaign overview and statistics.
 * Displays all campaigns with their metrics and action buttons.
 */
@Component({
  selector: 'app-resumen',
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    WelcomeBannerComponent
  ],
  templateUrl: './resumen.component.html',
  styleUrls: ['./resumen.component.css']
})
export class ResumenComponent implements OnInit {
  private readonly store = inject(CampaignStore);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly translate = inject(TranslateService);

  // Reactive signals from store
  campaigns = this.store.campaigns;
  loading = this.store.loading;

  // Computed metrics using signals
  totalImpressions = computed(() =>
    this.campaigns().reduce((sum, c) => sum + (c.totalImpressions || 0), 0)
  );

  totalClicks = computed(() =>
    this.campaigns().reduce((sum, c) => sum + (c.totalClicks || 0), 0)
  );

  averageCTR = computed(() => {
    const campaigns = this.campaigns();
    if (campaigns.length === 0) return 0;

    const ctrValues = campaigns
      .map((c) => calculateCtr(c.totalClicks, c.totalImpressions))
      .filter((ctr) => !isNaN(ctr) && isFinite(ctr));

    if (ctrValues.length === 0) {
      return 0;
    }

    const average = ctrValues.reduce((sum, ctr) => sum + ctr, 0) / ctrValues.length;
    return Number(average.toFixed(1));
  });

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.store.loadCampaignsByUserId(userId);
    }
  }

  /**
   * Get badge color based on campaign status
   */
  getStatusColor(status: CampaignStatus): string {
    switch (status) {
      case 'ACTIVE':
        return '#4CAF50';
      case 'PAUSED':
        return '#FFC107';
      case 'FINALIZED':
        return '#9E9E9E';
      default:
        return '#2196F3';
    }
  }

  /**
   * Get user-friendly status label
   */
  getStatusLabel(status: CampaignStatus): string {
    return this.translate.instant(`campaigns.statusLabels.${status}`);
  }

  /**
   * View campaign details (read-only)
   */
  onView(campaignId: number): void {
    this.router.navigate(['/ver-campaña', campaignId]);
  }

  /**
   * Edit campaign
   */
  onEdit(campaignId: number): void {
    this.router.navigate(['/editar-campaña', campaignId]);
  }

  /**
   * Toggle campaign active/paused status
   */
  onToggleStatus(campaignId: number): void {
    const campaign = this.findCampaign(campaignId);
    if (!campaign) return;

    const newStatus: CampaignStatus = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    const dialogKey: DialogAction = newStatus === 'ACTIVE' ? 'activate' : 'pause';
    const notification: NotificationKey = newStatus === 'ACTIVE' ? 'activateSuccess' : 'pauseSuccess';

    this.openCampaignDialog(dialogKey, campaign.name).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.updateCampaign(campaignId, this.buildStatusUpdates(campaign, newStatus));
        this.showNotification(notification);
      }
    });
  }

  /**
   * Delete campaign with confirmation
   */
  onDelete(campaignId: number): void {
    const campaign = this.findCampaign(campaignId);
    if (!campaign) return;

    this.openCampaignDialog('delete', campaign.name).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.deleteCampaign(campaignId);
        this.showNotification('deleteSuccess');
      }
    });
  }

  /**
   * Finalize campaign (change status to FINALIZED)
   */
  onFinalize(campaignId: number): void {
    const campaign = this.findCampaign(campaignId);
    if (!campaign) return;

    this.openCampaignDialog('finalize', campaign.name).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.updateCampaign(campaignId, this.buildStatusUpdates(campaign, 'FINALIZED'));
        this.showNotification('finalizeSuccess');
      }
    });
  }

  private findCampaign(campaignId: number): Campaign | undefined {
    return this.campaigns().find(c => c.id === campaignId);
  }

  private openCampaignDialog(action: DialogAction, name: string) {
    return this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.translate.instant(`campaigns.dialogs.${action}.title`),
        message: this.translate.instant(`campaigns.dialogs.${action}.message`, { name }),
        confirmText: this.translate.instant(`campaigns.dialogs.${action}.confirm`),
        cancelText: this.translate.instant('common.cancel'),
        isDanger: action === 'delete' || action === 'finalize'
      }
    });
  }

  private buildStatusUpdates(campaign: Campaign, status: CampaignStatus): Partial<Campaign> {
    return {
      name: campaign.name,
      description: campaign.description,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      estimatedBudget: campaign.estimatedBudget,
      status,
      totalImpressions: campaign.totalImpressions,
      totalClicks: campaign.totalClicks,
      CTR: campaign.CTR
    };
  }

  private showNotification(notification: NotificationKey): void {
    this.snackBar.open(
      this.translate.instant(`campaigns.notifications.${notification}`),
      this.translate.instant('common.close'),
      { duration: 3000 }
    );
  }
}
