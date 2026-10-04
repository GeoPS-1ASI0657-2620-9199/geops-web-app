import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CampaignStore } from '../../../application/campaign.store';
import { Campaign } from '../../../domain/model/campaign.entity';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';

/**
 * CreateCampaignComponent
 *
 * Form for creating new campaigns.
 * Includes validation and API integration.
 */
@Component({
  selector: 'app-crear-campaign',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './crear-campaign.component.html',
  styleUrls: ['./crear-campaign.component.css']
})
export class CrearCampaignComponent {
  private readonly fb = inject(FormBuilder);
  private readonly store = inject(CampaignStore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly defaultStatus: Campaign['status'] = 'ACTIVE';

  campaignForm: FormGroup;
  loading = this.store.loading;
  error = this.store.error;

  constructor() {
    this.campaignForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      estimatedBudget: [0, [Validators.required, Validators.min(0)]]
    });
  }

  onSubmit(): void {
    if (this.loading()) {
      return;
    }

    if (this.campaignForm.invalid) {
      this.campaignForm.markAllAsTouched();
      return;
    }

    const campaign: Partial<Campaign> = {
      ...this.campaignForm.value,
      status: this.defaultStatus,
      userId: this.getUserId(),
      totalImpressions: 0,
      totalClicks: 0,
      ctr: 0
    };

    this.store.createCampaign(campaign);
    // Navigate after a short delay to allow store to update
    setTimeout(() => this.router.navigate(['/campañas']), 500);
  }

  onCancel(): void {
    this.router.navigate(['/campañas']);
  }

  private getUserId(): number {
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      throw new Error('No authenticated user found');
    }
    return userId;
  }
}
