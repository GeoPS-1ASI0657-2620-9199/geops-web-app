import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SubscriptionPlansModalComponent, SubscriptionWithTranslations } from '../subscription-plans-modal/subscription-plans-modal.component';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { User } from '../../../../identity/domain/model/user.entity';

@Component({
  selector: 'app-welcome-banner',
  standalone: true,
  imports: [CommonModule, TranslateModule, SubscriptionPlansModalComponent],
  templateUrl: './welcome-banner.component.html',
  styleUrls: ['./welcome-banner.component.css']
})
export class WelcomeBannerComponent implements OnInit {
  /**
   * Signal that indicates if the plans modal is visible
   */
  showPlansModal = signal(false);

  /**
   * Signal that contains the current user
   */
  currentUser = signal<User | null>(null);

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Get current user
    const user = this.authService.getCurrentUser();
    this.currentUser.set(user);

    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  /**
   * Get current user plan type
   */
  getCurrentPlan(): 'BASIC' | 'PREMIUM' {
    return this.currentUser()?.plan || 'BASIC';
  }

  /**
   * Get current user role
   */
  getUserRole(): 'CONSUMER' | 'OWNER' {
    return (this.currentUser()?.role as 'CONSUMER' | 'OWNER') || 'CONSUMER';
  }

  /**
   * Check if user is a provider/owner
   */
  isProviderUser(): boolean {
    return this.getUserRole() === 'OWNER';
  }

  /**
   * Check if user has premium plan
   */
  isPremiumUser(): boolean {
    return this.getCurrentPlan() === 'PREMIUM';
  }

  /**
   * Shows the plans modal
   */
  showPlans(): void {
    this.showPlansModal.set(true);
  }

  /**
   * Hides the plans modal
   */
  closePlans(): void {
    this.showPlansModal.set(false);
  }

  /**
   * Handles the current plan button click
   */
  onCurrentPlanClick(): void {
    // Show all plans modal so user can upgrade/change plan
    this.showPlans();
  }

  /**
   * Handles plan selection
   * @param plan - The selected plan
   */
  onPlanSelect(plan: SubscriptionWithTranslations): void {
    // Here you would implement the logic to process the plan selection
    this.closePlans();
  }
}
