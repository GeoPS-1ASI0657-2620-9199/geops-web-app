import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';

type DialogAction = 'pause' | 'activate' | 'finalize' | 'delete';
type NotificationKey = 'pauseSuccess' | 'activateSuccess' | 'finalizeSuccess' | 'deleteSuccess';

/**
 * CampaignsComponent
 *
 * Main view for managing campaigns (Owner role).
 * Displays campaigns grouped by status: Active, Paused, Finished
 * Integrates with Campaign API for real-time data.
 */
@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.css']
})
export class CampaignsComponent implements OnInit {
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly translate = inject(TranslateService);

  selectedTabIndex = 0;
  campaigns = this.store.campaigns;
  loading = this.store.loading;
  error = this.store.error;

  /** Campaigns grouped by status */
  get activeCampaigns(): Campaign[] {
    return this.campaigns().filter(c => c.status === 'ACTIVE');
  }

  get pausedCampaigns(): Campaign[] {
    return this.campaigns().filter(c => c.status === 'PAUSED');
  }

  get finishedCampaigns(): Campaign[] {
    return this.campaigns().filter(c => c.status === 'FINALIZED');
  }

  ngOnInit(): void {
    this.loadCampaigns();
  }

  /**
   * Load campaigns for current user
   */
  loadCampaigns(): void {
    const userId = this.getUserId();
    this.store.loadCampaignsByUserId(userId);
  }

  /**
   * Get status color badge
   */
  getStatusColor(status: string): string {
    switch (status.toUpperCase()) {
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
   * Get campaigns for selected tab
   */
  getSelectedCampaigns(): Campaign[] {
    switch (this.selectedTabIndex) {
      case 0:
        return this.activeCampaigns;
      case 1:
        return this.pausedCampaigns;
      case 2:
        return this.finishedCampaigns;
      default:
        return [];
    }
  }

  /**
   * Navigate to edit campaign
   */
  onEdit(campaignId: number): void {
    this.router.navigate(['/editar-campaña', campaignId]);
  }

  /**
   * Pause campaign (change status to PAUSED)
   */
  onPause(campaignId: number): void {
    const campaign = this.findCampaign(campaignId);
    if (!campaign) return;

    this.openCampaignDialog('pause', campaign.name).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.updateCampaign(campaignId, this.buildStatusUpdates(campaign, 'PAUSED'));
        this.showNotification('pauseSuccess');
      }
    });
  }

  /**
   * Activate campaign (change status to ACTIVE)
   */
  onActivate(campaignId: number): void {
    const campaign = this.findCampaign(campaignId);
    if (!campaign) return;

    this.openCampaignDialog('activate', campaign.name).afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.store.updateCampaign(campaignId, this.buildStatusUpdates(campaign, 'ACTIVE'));
        this.showNotification('activateSuccess');
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

  /**
   * Resume/Edit campaign (change status to ACTIVE) - For paused campaigns
   */
  onResumeEdit(campaignId: number): void {
    this.onActivate(campaignId);
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
   * Get user ID from authentication service
   */
  private getUserId(): number {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return userId;
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

  private buildStatusUpdates(campaign: Campaign, status: Campaign['status']): Partial<Campaign> {
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
