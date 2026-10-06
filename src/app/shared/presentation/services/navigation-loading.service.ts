import { Injectable, signal } from '@angular/core';

/**
 * NavigationLoadingService
 *
 * Service to manage loading state during navigation between main sections.
 * Provides a backdrop to prevent user interactions during route transitions.
 *
 * @summary Manages navigation loading state and backdrop display
 */
@Injectable({
  providedIn: 'root'
})
export class NavigationLoadingService {
  /**
   * Signal to track loading state during navigation
   */
  public isNavigating = signal<boolean>(false);

  /**
   * Show the loading backdrop
   */
  showBackdrop(): void {
    this.isNavigating.set(true);
  }

  /**
   * Hide the loading backdrop
   */
  hideBackdrop(): void {
    this.isNavigating.set(false);
  }

  /**
   * Toggle backdrop visibility
   */
  toggleBackdrop(): void {
    this.isNavigating.update(value => !value);
  }
}
