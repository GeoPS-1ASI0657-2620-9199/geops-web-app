import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavigationLoadingService } from '../../services/navigation-loading.service';

/**
 * NavigationBackdropComponent
 *
 * Displays a full-screen backdrop with loading spinner during navigation.
 * Prevents user interactions while transitioning between routes.
 *
 * @summary Navigation loading backdrop component
 */
@Component({
  selector: 'app-navigation-backdrop',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './navigation-backdrop.component.html',
  styleUrl: './navigation-backdrop.component.css'
})
export class NavigationBackdropComponent {
  public navigationService = inject(NavigationLoadingService);
}
