import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { CampaignOffer } from '../../../domain/model/offer.entity';

/**
 * ViewCampaignComponent
 *
 * Read-only view for campaign details.
 * Shows campaign information and associated offers.
 */
@Component({
  selector: 'app-view-campaign',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  templateUrl: './view-campaign.component.html',
  styleUrls: ['./view-campaign.component.css']
})
export class ViewCampaignComponent implements OnInit {
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Public reactive signals from store
  loading = this.store.loading;
  campaign = this.store.selectedCampaign;
  offers = this.store.campaignOffers;

  ngOnInit(): void {
    const campaignId = +this.route.snapshot.params['id'];

    // Load campaign and offers data using store methods
    this.store.loadCampaignById(campaignId);
    this.store.loadOffersByCampaignId(campaignId);
  }

  getStatusColor(status: string): string {
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

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activa';
      case 'PAUSED':
        return 'Pausada';
      case 'FINALIZED':
        return 'Finalizada';
      default:
        return status;
    }
  }

  onEdit(): void {
    const campaignId = this.campaign()?.id;
    if (campaignId) {
      this.router.navigate(['/editar-campaña', campaignId]);
    }
  }

  onBack(): void {
    this.router.navigate(['/resumen']);
  }
}
