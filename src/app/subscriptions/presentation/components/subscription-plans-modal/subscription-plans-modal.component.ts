import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subscription } from '../../../domain/model/subscription.entity';
import { SubscriptionsApi } from '../../../infrastructure/subscriptions-api';
import { UsersApi } from '../../../../shared/infrastructure/users-api';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';

/**
 * Extended subscription interface with translation data
 */
export interface SubscriptionWithTranslations extends Subscription {
  name: string;
  description: string;
  features: string[];
  buttonText: string;
  currency: string;
  interval: string;
}

@Component({
  selector: 'app-subscription-plans-modal',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './subscription-plans-modal.component.html',
  styleUrls: ['./subscription-plans-modal.component.css']
})
export class SubscriptionPlansModalComponent implements OnInit {
  /**
   * Controls whether the modal is visible
   */
  @Input() isVisible = false;

  /**
   * Event emitted when the modal should be closed
   */
  @Output() closeModal = new EventEmitter<void>();

  /**
   * Event emitted when a plan is selected
   */
  @Output() planSelected = new EventEmitter<SubscriptionWithTranslations>();

  /**
   * Signal that contains the subscription plans with translations
   */
  subscriptionPlans = signal<SubscriptionWithTranslations[]>([]);

  /**
   * Signal that indicates if data is being loaded
   */
  loading = signal(false);

  /**
   * Signal that indicates if a plan is being selected/updated
   */
  updating = signal(false);

  /**
   * Signal that contains the current user role
   */
  userRole = signal<'CONSUMER' | 'OWNER'>('CONSUMER');


  userId = 0;

  constructor(
    private SubscriptionsApi: SubscriptionsApi,
    private translateService: TranslateService,
    private usersApi: UsersApi,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = (user.id);
      this.userRole.set((user.role as 'CONSUMER' | 'OWNER') || 'CONSUMER');
    } else {
      console.warn('[Layout] No hay usuario autenticado');
    }

    // Wait for translations to load before loading plans
    this.translateService.onLangChange.subscribe(() => {
      if (this.subscriptionPlans().length > 0) {
        this.loadSubscriptionPlans();
      }
    });

    // Use stream to ensure translations are loaded
    this.translateService.stream('subscriptions.currency').subscribe(() => {
      this.loadSubscriptionPlans();
    });
  }

  /**
   * Loads subscription plans from the API and merges with translations
   */
  private loadSubscriptionPlans(): void {
    this.loading.set(true);
    this.SubscriptionsApi.getSubscriptions().subscribe({
      next: (plans) => {
        const plansWithTranslations = plans.map((plan) => this.enrichPlanWithTranslations(plan));
        this.subscriptionPlans.set(plansWithTranslations);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading subscription plans:', error);
        this.loading.set(false);
      },
    });
  }

  /**
   * Enriches a subscription plan with translation data
   * @param plan - The base subscription plan
   * @returns The plan enriched with translations
   */
  private enrichPlanWithTranslations(plan: Subscription): SubscriptionWithTranslations {
    // Determine the correct translation path based on user role
    const roleKey = this.userRole() === 'OWNER' ? 'provider' : 'consumer';
    const planType = plan.type.toLowerCase();
    const planKey = `subscriptions.${roleKey}.plans.${planType}`;

    // Get translations
    const nameKey = `${planKey}.name`;
    const descriptionKey = `${planKey}.description`;
    const featuresKey = `${planKey}.features`;
    const buttonTextKey = `${planKey}.buttonText`;

    const name = this.translateService.instant(nameKey);
    const description = this.translateService.instant(descriptionKey);
    const features = this.translateService.instant(featuresKey);
    const buttonText = this.translateService.instant(buttonTextKey);
    const currency = this.translateService.instant('subscriptions.currency');
    const interval = this.translateService.instant('subscriptions.interval');


    // Check if translation failed (returns the key itself)
    const translationFailed = name === nameKey;
    if (translationFailed) {
      console.error('[SubscriptionPlansModal] ❌ Translation FAILED for key:', nameKey);
      console.error('[SubscriptionPlansModal] Current language:', this.translateService.currentLang);
      console.error('[SubscriptionPlansModal] Default language:', this.translateService.defaultLang);
    }

    return {
      ...plan,
      name: name !== nameKey ? name : plan.type.toLowerCase(), // Fallback to type if translation fails
      description: description !== descriptionKey ? description : '',
      features: Array.isArray(features) ? features : [],
      buttonText: buttonText !== buttonTextKey ? buttonText : 'Select',
      currency: currency || 's/',
      interval: interval || 'month',
    };
  }

  /**
   * Handles closing the modal
   */
  onClose(): void {
    this.closeModal.emit();
  }

  /**
   * Handles plan selection and updates the user's plan
   * @param plan - The selected plan
   */
  onPlanSelect(plan: SubscriptionWithTranslations): void {
    this.updating.set(true);

    this.usersApi.updateUserPlan(this.userId, plan.type).subscribe({
      next: (updatedUser) => {
        // Refresh the current user data to reflect the plan change
        this.authService.refreshCurrentUser().subscribe({
          next: (refreshedUser) => {
            this.updating.set(false);

            // Emit the plan selection event
            this.planSelected.emit(plan);

            // Close the modal
            this.onClose();
          },
          error: (refreshError) => {
            console.error('Error refreshing user data:', refreshError);
            this.updating.set(false);

            // Emit the plan selection event
            this.planSelected.emit(plan);

            // Close the modal
            this.onClose();
          }
        });
      },
      error: (error) => {
        console.error('Error updating user plan:', error);
        this.updating.set(false);

        // Show error message
        alert('Error al actualizar el plan. Por favor, inténtelo de nuevo.');
      },
    });
  }

  /**
   * Handles backdrop click to close modal
   * @param event - The click event
   */
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }
}
