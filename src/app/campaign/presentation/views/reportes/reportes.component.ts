import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { calculateCtr } from '../../../domain/utils/campaign-metrics.util';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';

/**
 * ReportesComponent
 *
 * Component for generating and exporting campaign reports.
 * Supports JSON, CSV, and filtered exports.
 */
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatButtonModule, MatIconModule, MatCardModule, MatSelectModule, MatFormFieldModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {
  private readonly store = inject(CampaignStore);
  private readonly authService = inject(AuthService);

  campaigns = this.store.campaigns;
  filterStatus: string = 'ALL';
  reportFormat: 'json' | 'csv' = 'json';

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    const userId = this.authService.getCurrentUserId();
    if (userId) {
      this.store.loadCampaignsByUserId(userId);
    }
  }

  get filteredCampaigns(): Campaign[] {
    const campaigns = this.campaigns();
    if (this.filterStatus === 'ALL') {
      return campaigns;
    }
    return campaigns.filter(c => c.status === this.filterStatus);
  }

  get reportData(): any {
    const campaigns = this.filteredCampaigns;
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.totalImpressions, 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.totalClicks, 0);
    const totalBudget = campaigns.reduce((sum, c) => sum + c.estimatedBudget, 0);

    const ctrValues = campaigns
      .map(c => calculateCtr(c.totalClicks, c.totalImpressions))
      .filter(ctr => !isNaN(ctr) && isFinite(ctr));

    const averageCTR = ctrValues.length > 0
      ? Number((ctrValues.reduce((sum, ctr) => sum + ctr, 0) / ctrValues.length).toFixed(1))
      : 0;

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalCampaigns: campaigns.length,
        totalImpressions,
        totalClicks,
        totalBudget,
        averageCTR,
        byStatus: {
          active: campaigns.filter(c => c.status === 'ACTIVE').length,
          paused: campaigns.filter(c => c.status === 'PAUSED').length,
          finalized: campaigns.filter(c => c.status === 'FINALIZED').length
        }
      },
      campaigns: campaigns.map(c => ({
        id: c.id,
        name: c.name,
        description: c.description,
        status: c.status,
        startDate: c.startDate,
        endDate: c.endDate,
        estimatedBudget: c.estimatedBudget,
        totalImpressions: c.totalImpressions,
        totalClicks: c.totalClicks,
        ctr: calculateCtr(c.totalClicks, c.totalImpressions),
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    };
  }

  get jsonData(): string {
    return JSON.stringify(this.reportData, null, 2);
  }

  get csvData(): string {
    const campaigns = this.filteredCampaigns;
    const headers = ['ID', 'Nombre', 'Estado', 'Fecha Inicio', 'Fecha Fin', 'Presupuesto', 'Impresiones', 'Clicks', 'CTR (%)'];
    const rows = campaigns.map((c) => {
      const ctr = calculateCtr(c.totalClicks, c.totalImpressions);
      return [
        c.id,
        c.name,
        c.status,
        c.startDate,
        c.endDate,
        c.estimatedBudget,
        c.totalImpressions,
        c.totalClicks,
        ctr,
      ];
    });

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  exportReport(): void {
    const timestamp = new Date().getTime();
    const filename = `campaign-report-${timestamp}`;

    if (this.reportFormat === 'json') {
      this.downloadFile(this.jsonData, `${filename}.json`, 'application/json');
    } else {
      this.downloadFile(this.csvData, `${filename}.csv`, 'text/csv');
    }
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  printReport(): void {
    window.print();
  }
}
